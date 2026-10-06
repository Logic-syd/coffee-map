import test from "node:test";
import assert from "node:assert/strict";
import {
  localizeVenueNames,
  isLatinOriginal,
} from "../src/utils/venue-names.ts";
import { VENUE_NAME_LOCALIZATIONS } from "../src/data/venue-name-localizations.ts";
import { parseVenues } from "../src/utils/venue-data.ts";
import { matchesVenueSearch } from "../src/utils/venue-search.ts";
import { matchesFeatureSearch } from "../src/lib/venue-features.ts";
import { normalizeSearchText } from "../src/utils/search-text.ts";

test("English original brand names never get translated in any locale", () => {
  for (const original of [
    "Punchline On Air",
    "Parking Coffee",
    "CAN COMPANY",
    "Lumière Cafe",
  ]) {
    const source = {
      zh: original,
      ja: "古い訳名",
      en: original,
      ko: "이전 번역",
    };
    const before = structuredClone(source);
    const result = localizeVenueNames("unknown", source);
    for (const locale of ["zh", "en", "ja", "ko"])
      assert.equal(result[locale], original);
    assert.deepEqual(source, before);
  }
  assert.equal(isLatinOriginal("田咖啡"), false);
  assert.equal(isLatinOriginal("DOE Coffee(新天地店)"), false);
});
test("Chinese originals use existing translations, preserving the original for recognition", () => {
  const source = {
    zh: "叁叁coffee",
    en: "33 coffee",
    ja: "サンサンコーヒー",
    ko: "산산 커피",
  };
  assert.deepEqual(localizeVenueNames("example", source), source);
});
test("reviewed mixed names preserve the English brand while localizing branch information", () => {
  const patch = VENUE_NAME_LOCALIZATIONS.find(
    (item) => item.original === "Tequila Espresso(嘉善路店)",
  );
  const source = { zh: patch.original, ...patch.source };
  const result = localizeVenueNames(patch.id, source);
  assert.equal(result.ja, "Tequila Espresso（嘉善路店）");
  assert.equal(result.zh, patch.original);
});
test("a newer database translation or renamed venue always supersedes an old display patch", () => {
  const patch = VENUE_NAME_LOCALIZATIONS[0];
  const source = {
    zh: patch.original,
    ...patch.source,
    ja: "新しい確認済みの店名",
  };
  assert.equal(localizeVenueNames(patch.id, source).ja, source.ja);
  const renamed = { ...source, zh: "新店名" };
  assert.deepEqual(localizeVenueNames(patch.id, renamed), renamed);
  assert.equal(
    new Set(VENUE_NAME_LOCALIZATIONS.map((item) => item.id)).size,
    VENUE_NAME_LOCALIZATIONS.length,
  );
});
test("name normalization retains original Japanese aliases for English brand searches", () => {
  const [venue] = parseVenues([
    {
      id: "test",
      lat: 31.2,
      lng: 121.4,
      name_zh: "Parking Coffee",
      name_eng: "Parking Coffee",
      name_ja: "パーキングコーヒー",
      name_ko: "파킹 커피",
    },
  ]);
  assert.equal(venue.name.ja, "Parking Coffee");
  for (const query of [
    "Parking Coffee",
    "ＰＡＲＫＩＮＧ",
    "ぱーきんぐ",
    "ﾊﾟｰｷﾝｸﾞ",
    "파킹",
  ])
    assert.equal(matchesVenueSearch(venue, query), true, query);
});
test("kana, width, Latin accents and Korean composition are equivalent only for search", () => {
  const venue = {
    id: "test",
    name: {
      zh: "原店名",
      en: "Lumière Cafe",
      ja: "ポリーコーヒー",
      ko: "폴리 커피",
    },
    address: "上海市长乐路",
  };
  for (const query of [
    "LUMIERE",
    "ポリー",
    "ぽりー",
    "ﾎﾟﾘｰ",
    "폴리",
    "폴리".normalize("NFD"),
    "长乐路",
  ])
    assert.equal(matchesVenueSearch(venue, query), true, query);
  assert.equal(matchesVenueSearch(venue, "unrelated"), false);
  assert.equal(matchesVenueSearch(venue, "!!!"), false);
  assert.equal(matchesVenueSearch(venue, ""), true);
  assert.equal(normalizeSearchText("パ"), normalizeSearchText("ぱ"));
  assert.notEqual(normalizeSearchText("パ"), normalizeSearchText("ハ"));
  assert.equal(
    matchesFeatureSearch({ serving: ["hand_drip"] }, "はんどどりっぷ"),
    true,
  );
});
