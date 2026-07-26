const test = require("node:test");
const assert = require("node:assert/strict");
const { computeChunkRanges } = require("./chunked-upload.js");

test("splits a file smaller than one chunk into a single range", () => {
  const ranges = computeChunkRanges(500, 1024);
  assert.deepEqual(ranges, [
    { start: 0, end: 499, contentRange: "bytes 0-499/500" },
  ]);
});

test("splits an exact multiple of the chunk size with no remainder", () => {
  const ranges = computeChunkRanges(2048, 1024);
  assert.deepEqual(ranges, [
    { start: 0, end: 1023, contentRange: "bytes 0-1023/2048" },
    { start: 1024, end: 2047, contentRange: "bytes 1024-2047/2048" },
  ]);
});

test("last range is shorter than chunkSize when there is a remainder", () => {
  const ranges = computeChunkRanges(2500, 1024);
  assert.equal(ranges.length, 3);
  assert.deepEqual(ranges[2], {
    start: 2048,
    end: 2499,
    contentRange: "bytes 2048-2499/2500",
  });
});

test("empty file produces no ranges", () => {
  assert.deepEqual(computeChunkRanges(0, 1024), []);
});

test("rejects a non-positive chunk size", () => {
  assert.throws(() => computeChunkRanges(100, 0), RangeError);
});
