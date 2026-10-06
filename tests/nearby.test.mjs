import test from "node:test";
import assert from "node:assert/strict";
import {
  SHANGHAI_CENTER,
  NEARBY_RADIUS_KM,
  isWithinShanghaiCoverage,
  withDistances,
} from "../src/utils/nearby.ts";

test("travelers outside Shanghai get city browsing instead of an empty nearby list", () => {
  assert.equal(isWithinShanghaiCoverage(SHANGHAI_CENTER), true);
  for (const coords of [
    { lat: 35.68, lng: 139.69 },
    { lat: 37.56, lng: 126.98 },
    { lat: 52.52, lng: 13.4 },
  ])
    assert.equal(isWithinShanghaiCoverage(coords), false);
});
test("location distances sort venues without mutating fetched data", () => {
  const rows = Object.freeze([
    Object.freeze({
      id: "far",
      lat: SHANGHAI_CENTER.lat + 0.1,
      lng: SHANGHAI_CENTER.lng,
    }),
    Object.freeze({ id: "near", ...SHANGHAI_CENTER }),
  ]);
  const sorted = withDistances(rows, SHANGHAI_CENTER);
  assert.deepEqual(
    sorted.map((venue) => venue.id),
    ["near", "far"],
  );
  assert.equal(sorted[0].distanceKm, 0);
  assert.ok(sorted[1].distanceKm > NEARBY_RADIUS_KM);
  assert.deepEqual(
    rows.map((venue) => venue.id),
    ["far", "near"],
  );
  assert.equal(rows[0].distanceKm, undefined);
});
test("missing location keeps all venues without invented distance", () => {
  const rows = [{ id: "cafe", ...SHANGHAI_CENTER }];
  assert.deepEqual(withDistances(rows), rows);
  assert.equal(withDistances(rows)[0].distanceKm, undefined);
});
