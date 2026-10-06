import test from "node:test";
import assert from "node:assert/strict";
import {
  LANGUAGES,
  LANGUAGE_STORAGE_KEY,
  languagePreference,
  resolveLanguage,
  readLanguagePreference,
  saveLanguagePreference,
} from "../src/lib/locale.ts";
import {
  translations,
  t,
  venueName,
  formatDistance,
  formatHours,
} from "../src/lib/i18n.ts";
import {
  VENUE_FEATURES,
  featureLocale,
  featureLabel,
} from "../src/lib/venue-features.ts";

test("every public UI key has nonempty translations in all four languages", () => {
  for (const [key, values] of Object.entries(translations))
    for (const locale of LANGUAGES)
      assert.ok(values[locale]?.trim(), `${key}/${locale}`);
  for (const feature of VENUE_FEATURES)
    for (const locale of LANGUAGES)
      assert.ok(feature.labels[locale]?.trim(), `${feature.id}/${locale}`);
});
test("automatic language follows the first supported device language", () => {
  assert.equal(resolveLanguage("system", ["de-DE", "ja-JP", "en-US"]), "ja");
  assert.equal(resolveLanguage("system", ["ko-KR", "en-US"]), "ko");
  assert.equal(resolveLanguage("system", ["zh-Hant-TW"]), "zh-CN");
  assert.equal(resolveLanguage("system", ["JA_jp"]), "ja");
  assert.equal(resolveLanguage("system", ["en-GB", "ja-JP"]), "en");
  assert.equal(resolveLanguage("system", ["de-DE"]), "en");
  assert.equal(resolveLanguage("system", []), "en");
  assert.equal(featureLocale("KO-kr"), "ko");
});
test("manual choice takes priority and invalid saved values return to automatic", () => {
  assert.equal(resolveLanguage("ja", ["ko-KR"]), "ja");
  for (const value of [null, undefined, "", "bad", "ja-JP"])
    assert.equal(languagePreference(value), "system");
  for (const locale of LANGUAGES)
    assert.equal(languagePreference(locale), locale);
});
test("a saved language survives reopening, and switching back to system is persistent", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  saveLanguagePreference(storage, "ko");
  assert.equal(values.get(LANGUAGE_STORAGE_KEY), "ko");
  assert.equal(
    resolveLanguage(readLanguagePreference(storage), ["ja-JP"]),
    "ko",
  );
  saveLanguagePreference(storage, "system");
  assert.equal(
    resolveLanguage(readLanguagePreference(storage), ["ja-JP"]),
    "ja",
  );
});
test("blocked storage never prevents selecting a language", () => {
  const storage = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("quota");
    },
  };
  assert.equal(readLanguagePreference(storage), "system");
  assert.doesNotThrow(() => saveLanguagePreference(storage, "ja"));
  assert.doesNotThrow(() => saveLanguagePreference(undefined, "ja"));
});
test("missing localized names and tag labels fall back to Chinese without blanks", () => {
  assert.equal(venueName({ zh: "咖啡店", ja: " " }, "ja"), "咖啡店");
  assert.equal(venueName({ zh: "原名", ja: "カフェ" }, "ja"), "カフェ");
  assert.equal(venueName({}, "ko"), "카페");
  assert.equal(
    featureLabel(
      { id: "custom", labels: { ja: " ", "zh-CN": "可带猫" } },
      "ja",
    ),
    "可带猫",
  );
  assert.equal(
    t("action.share", "unavailable"),
    translations["action.share"]["zh-CN"],
  );
});
test("overnight hours use localized next-day text and distances retain useful precision", () => {
  assert.equal(formatHours("22:00", "02:00", "ja"), "22:00–02:00 (翌日)");
  assert.equal(formatHours("22:00", "02:00", "ko"), "22:00–02:00 (다음 날)");
  assert.equal(formatHours("09:00", "18:00", "en"), "09:00–18:00");
  for (const locale of LANGUAGES) {
    assert.match(formatDistance(0.35, locale), /350/);
    assert.match(formatDistance(1.25, locale), /1.3/);
  }
});
