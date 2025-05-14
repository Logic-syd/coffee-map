import { calcDistanceKm } from "./geo";

test("calcDistanceKm returns correct distance", () => {
  expect(
    Math.round(
      calcDistanceKm(
        { lat: 31.2304, lng: 121.4737 },
        { lat: 31.2304, lng: 121.4737 },
      ),
    ),
  ).toBe(0);
  expect(
    Math.round(
      calcDistanceKm(
        { lat: 31.2304, lng: 121.4737 },
        { lat: 31.2404, lng: 121.4737 },
      ),
    ),
  ).toBe(1);
});
