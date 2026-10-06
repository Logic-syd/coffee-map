import test from "node:test";
import assert from "node:assert/strict";
import { calcDistanceKm } from "../src/utils/geo.ts";
test("distance is zero at the same point and about 1.11 km per 0.01 degree latitude", () => {
  const origin = { lat: 31.2304, lng: 121.4737 };
  assert.equal(calcDistanceKm(origin, origin), 0);
  assert.ok(
    Math.abs(calcDistanceKm(origin, { lat: 31.2404, lng: 121.4737 }) - 1.112) <
      0.01,
  );
});
