import test from "node:test";
import assert from "node:assert/strict";
import { parseVenues } from "../src/utils/venue-data.ts";
import { getOpeningState } from "../src/utils/opening-hours.ts";
const row = {
  id: "cafe-1",
  lat: 31.2,
  lng: 121.4,
  name_zh: " 咖啡馆 ",
  name_eng: " Cafe ",
  name_ja: " カフェ ",
  name_ko: " 카페 ",
  address: " 上海 ",
  tel: " 123456 ",
};

test("venue names in all four languages and contacts are preserved", () => {
  const [venue] = parseVenues([row]);
  assert.deepEqual(venue.name, {
    zh: "咖啡馆",
    en: "Cafe",
    ja: "カフェ",
    ko: "카페",
  });
  assert.equal(venue.address, "上海");
  assert.equal(venue.contacts.tel, "123456");
});
test("incomplete optional data is safe and never invents opening hours", () => {
  const [venue] = parseVenues([
    {
      ...row,
      address: null,
      image_url: "",
      name_eng: 99,
      hours_json: { default: null },
      serving: ["espresso", null, 99],
      services: "wifi",
      tags: null,
    },
  ]);
  assert.equal(venue.address, "");
  assert.equal(venue.image_url, undefined);
  assert.equal(venue.name.en, undefined);
  assert.deepEqual(venue.serving, ["espresso"]);
  assert.equal(venue.services, undefined);
  assert.equal(venue.tags, undefined);
  assert.equal(
    getOpeningState(venue.hours, new Date("2026-10-05T00:00:00Z")),
    "unknown",
  );
});
test("one malformed record cannot prevent other usable venues from rendering", () => {
  assert.deepEqual(
    parseVenues([
      null,
      {},
      { ...row, id: "" },
      { ...row, lat: 999 },
      { ...row, lng: "121" },
      row,
    ]).map((venue) => venue.id),
    ["cafe-1"],
  );
});
test("a genuine empty catalog differs from an unusable API response", () => {
  assert.deepEqual(parseVenues([]), []);
  for (const rows of [
    null,
    {},
    { error: "failed" },
    [null],
    [{ ...row, lat: 999 }],
  ])
    assert.throws(() => parseVenues(rows));
});
test("timestamps survive normalization without generating a verification date", () => {
  const [venue] = parseVenues([
    {
      ...row,
      created_at: "2025-05-01T00:00:00Z",
      updated_at: "2026-10-05T00:00:00Z",
    },
  ]);
  assert.equal(venue.updated_at, "2026-10-05T00:00:00Z");
  assert.equal(venue.created_at, "2025-05-01T00:00:00Z");
});
