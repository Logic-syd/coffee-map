import test from "node:test";
import assert from "node:assert/strict";
import { isImageSource } from "../src/utils/image-source.ts";

test("image sources accept storage URLs and local assets", () => {
  for (const src of [
    "https://example.com/storage/cafe.webp",
    "http://example.com/cafe.jpg",
    "/cafe.png",
  ])
    assert.equal(isImageSource(src), true);
});
test("unsupported or malformed image sources fall back before rendering", () => {
  for (const src of [
    "",
    "https://",
    "//example.com/photo.jpg",
    "javascript:alert(1)",
    "data:image/png;base64,xxx",
    "cafe.png",
  ])
    assert.equal(isImageSource(src), false);
});
