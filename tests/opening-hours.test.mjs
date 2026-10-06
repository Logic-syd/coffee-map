import test from "node:test";
import assert from "node:assert/strict";
import { isOpenNow, getOpeningState } from "../src/utils/opening-hours.ts";

const at = (time) => new Date(`2026-10-05T${time}:00+08:00`);
const split = {
  default: [
    ["Mon", "09:00", "12:00"],
    ["Mon", "14:00", "18:00"],
  ],
};

test("both Monday sessions are open", () => {
  assert.equal(isOpenNow(split, at("10:00")), true);
  assert.equal(isOpenNow(split, at("15:00")), true);
});
test("midday break and after closing are closed", () => {
  assert.equal(isOpenNow(split, at("13:00")), false);
  assert.equal(isOpenNow(split, at("18:30")), false);
});
test("opening is inclusive and closing is exclusive", () => {
  for (const time of ["09:00", "14:00"])
    assert.equal(isOpenNow(split, at(time)), true);
  for (const time of ["12:00", "18:00"])
    assert.equal(isOpenNow(split, at(time)), false);
});
test("overnight sessions continue into the following day", () => {
  const hours = { default: [["Mon", "22:00", "02:00"]] };
  assert.equal(isOpenNow(hours, at("23:00")), true);
  assert.equal(isOpenNow(hours, new Date("2026-10-06T01:00:00+08:00")), true);
  assert.equal(isOpenNow(hours, new Date("2026-10-06T02:00:00+08:00")), false);
  assert.equal(isOpenNow(hours, at("01:00")), false);
});
test("Sunday overnight rolls over to Monday", () => {
  assert.equal(
    isOpenNow({ default: [["Sun", "22:00", "02:00"]] }, at("01:00")),
    true,
  );
});
test("Shanghai clock determines the day and time regardless of viewer timezone", () => {
  assert.equal(isOpenNow(split, new Date("2026-10-05T02:00:00Z")), true);
  assert.equal(isOpenNow(split, new Date("2026-10-05T10:00:00+02:00")), true);
});
test("00:00 to 24:00 represents a full day", () => {
  const hours = { default: [["Mon", "00:00", "24:00"]] };
  assert.equal(isOpenNow(hours, at("00:00")), true);
  assert.equal(isOpenNow(hours, at("23:59")), true);
  assert.equal(isOpenNow(hours, new Date("2026-10-06T00:00:00+08:00")), false);
});
test("missing, empty and malformed intervals do not report open", () => {
  for (const hours of [
    undefined,
    {},
    { default: [] },
    { default: null },
    { default: [["Mon", "25:00", "28:00"]] },
    { default: [["Mon", "09:90", "18:00"]] },
    { default: [["Mon", "09:00", "09:00"]] },
    { default: [null, ["Mon"]] },
  ]) {
    assert.equal(isOpenNow(hours, at("10:00")), false);
  }
});

test("unknown hours stay distinct from confirmed closure", () => {
  for (const hours of [
    undefined,
    null,
    {},
    { default: [] },
    { default: "Monday" },
  ]) {
    assert.equal(getOpeningState(hours, at("10:00")), "unknown");
  }
  assert.equal(getOpeningState(split, at("10:00")), "open");
  assert.equal(getOpeningState(split, at("13:00")), "closed");
  assert.equal(
    getOpeningState(split, new Date("2026-10-06T10:00:00+08:00")),
    "closed",
  );
});
test("a partially invalid weekly schedule cannot claim open or closed", () => {
  const invalid = [
    ["Monday", "09:00", "18:00"],
    ["Tue", "24:00", "24:00"],
    ["Tue", "9:00", "18:00"],
    ["Tue", "09:00", "24:01"],
    ["Tue", "09:00", "09:00"],
    null,
  ];
  for (const entry of invalid) {
    assert.equal(
      getOpeningState({ default: [...split.default, entry] }, at("10:00")),
      "unknown",
    );
  }
});
test("invalid device time never claims the venue is closed", () => {
  assert.equal(getOpeningState(split, new Date("invalid")), "unknown");
});
