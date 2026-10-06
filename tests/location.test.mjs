import test from "node:test";
import assert from "node:assert/strict";
import {
  isCoordinates,
  readCachedCoordinates,
  getCurrentCoordinates,
  LocationFailure,
  LOCATION_MAX_AGE,
  LOCATION_TIMEOUT,
} from "../src/utils/location.ts";

const coords = { lat: 31.2241, lng: 121.4466 };
const position = { coords: { latitude: coords.lat, longitude: coords.lng } };
const failure = (status) => (error) =>
  error instanceof LocationFailure && error.status === status;

test("coordinates reject missing, non-numeric and out-of-world positions", () => {
  assert.equal(isCoordinates(coords), true);
  assert.equal(isCoordinates({ lat: -90, lng: 180 }), true);
  for (const value of [
    null,
    {},
    { lat: "31", lng: 121 },
    { lat: NaN, lng: 121 },
    { lat: 0, lng: Infinity },
    { lat: 91, lng: 0 },
    { lat: 0, lng: -181 },
  ])
    assert.equal(isCoordinates(value), false);
});
test("only recent timestamped coordinates survive the optional cache", () => {
  const now = 1_000_000;
  const cache = (timestamp) => JSON.stringify({ ...coords, timestamp });
  assert.deepEqual(readCachedCoordinates(cache(now), now), coords);
  assert.deepEqual(
    readCachedCoordinates(cache(now - LOCATION_MAX_AGE), now),
    coords,
  );
  for (const raw of [
    null,
    "not JSON",
    JSON.stringify(coords),
    cache(now + 1),
    cache(now - LOCATION_MAX_AGE - 1),
    cache("today"),
    JSON.stringify({ lat: 100, lng: 121, timestamp: now }),
  ])
    assert.equal(readCachedCoordinates(raw, now), undefined);
});
test("location success is bounded and normalizes browser coordinates", async () => {
  const geo = {
    getCurrentPosition(success, _failure, options) {
      assert.equal(options.timeout, LOCATION_TIMEOUT);
      assert.equal(options.maximumAge, 60_000);
      success(position);
    },
  };
  assert.deepEqual(await getCurrentCoordinates(geo), coords);
});
for (const [code, status] of [
  [1, "denied"],
  [2, "unavailable"],
  [3, "timeout"],
]) {
  test(`browser location error ${code} produces the ${status} fallback`, async () => {
    await assert.rejects(
      getCurrentCoordinates({
        getCurrentPosition(_success, reject) {
          reject({ code });
        },
      }),
      failure(status),
    );
  });
}
test("unsupported and throwing location APIs settle as unavailable", async () => {
  await assert.rejects(
    getCurrentCoordinates(undefined),
    failure("unavailable"),
  );
  await assert.rejects(
    getCurrentCoordinates({
      getCurrentPosition() {
        throw new Error("blocked");
      },
    }),
    failure("unavailable"),
  );
  await assert.rejects(
    getCurrentCoordinates({
      getCurrentPosition(success) {
        success({ coords: { latitude: NaN, longitude: 0 } });
      },
    }),
    failure("unavailable"),
  );
});
test("a platform that never calls back still times out; late success is ignored", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let lateSuccess;
  const result = getCurrentCoordinates({
    getCurrentPosition(success) {
      lateSuccess = success;
    },
  });
  const rejected = assert.rejects(result, failure("timeout"));
  t.mock.timers.tick(LOCATION_TIMEOUT);
  await rejected;
  lateSuccess(position);
  await assert.rejects(result, failure("timeout"));
});
test("unmount abort cancels a pending location request and ignores later callbacks", async () => {
  const controller = new AbortController();
  let success;
  const result = getCurrentCoordinates(
    {
      getCurrentPosition(next) {
        success = next;
      },
    },
    controller.signal,
  );
  const rejected = assert.rejects(result, failure("unavailable"));
  controller.abort();
  await rejected;
  success(position);
  await assert.rejects(result, failure("unavailable"));
});
test("a request already aborted does not invoke the browser", async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    getCurrentCoordinates(
      {
        getCurrentPosition() {
          assert.fail("must not request location");
        },
      },
      controller.signal,
    ),
    failure("unavailable"),
  );
});
