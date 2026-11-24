import assert from "node:assert/strict";
import test from "node:test";
import { dice, normalize, stripCommentMarkers, tokenSet } from "../src/normalize";

test("lowercases, folds punctuation and collapses whitespace", () => {
  assert.equal(normalize("  MIT   License!\n\nVersion\t2.0  "), "mit license version 2 0");
});

test("unifies British and American spelling", () => {
  assert.equal(normalize("Licence"), "license");
  assert.equal(normalize("LICENCE"), "license");
});

test("strips line comment markers", () => {
  const input = "// MIT License\n# Apache License\n* BSD License";
  assert.equal(stripCommentMarkers(input), "MIT License\nApache License\nBSD License");
});

test("strips block comment markers", () => {
  const input = "/*\n * MIT License\n * Copyright (c) 2026 X\n */";
  const stripped = stripCommentMarkers(input);
  assert.ok(stripped.includes("MIT License"));
  assert.ok(!stripped.includes("/*"));
  assert.ok(!stripped.includes("*/"));
});

test("strips HTML comment markers", () => {
  assert.equal(stripCommentMarkers("<!-- MIT License -->"), "MIT License");
});

test("normalizes a comment header to the same form as a plain file", () => {
  const header = "// Permission is hereby granted, free of charge,";
  const plain = "Permission is hereby granted, free of charge,";
  assert.equal(normalize(header), normalize(plain));
});

test("tokenSet returns distinct normalized words", () => {
  const tokens = tokenSet("MIT License, MIT license; MIT LICENSE");
  assert.deepEqual([...tokens].sort(), ["license", "mit"]);
});

test("dice is 1 for identical sets and 0 for disjoint sets", () => {
  assert.equal(dice(new Set(["a", "b"]), new Set(["a", "b"])), 1);
  assert.equal(dice(new Set(["a"]), new Set(["b"])), 0);
});

test("dice rewards overlap relative to the smaller set", () => {
  // {a, b} vs {a, b, c, d}: 2*2 / (2+4) = 0.667
  const score = dice(new Set(["a", "b"]), new Set(["a", "b", "c", "d"]));
  assert.ok(Math.abs(score - 2 / 3) < 0.001);
});

test("dice is 0 when either set is empty", () => {
  assert.equal(dice(new Set(), new Set(["a"])), 0);
  assert.equal(dice(new Set(["a"]), new Set()), 0);
});
