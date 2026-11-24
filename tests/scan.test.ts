import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { detectFile, scanPath } from "../src/scan";

function fixture(name: string): string {
  return readFileSync(join(__dirname, "..", "..", "tests", "fixtures", name), "utf8");
}

function makeProject(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "license-detector-"));
  for (const [rel, content] of Object.entries(files)) {
    const full = join(root, rel);
    mkdirSync(join(full, ".."), { recursive: true });
    writeFileSync(full, content);
  }
  return root;
}

test("detectFile reads a whole license file", () => {
  const root = makeProject({ "LICENSE": fixture("mit.txt") });
  try {
    const detection = detectFile(join(root, "LICENSE"));
    assert.equal(detection.spdx, "MIT");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("detectFile reads only the header of a source file", () => {
  const root = makeProject({ "src/app.ts": fixture("mit-header.ts") });
  try {
    const detection = detectFile(join(root, "src/app.ts"));
    assert.equal(detection.spdx, "MIT");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("scanPath finds license files and licensed headers, and summarizes", () => {
  const root = makeProject({
    "LICENSE": fixture("mit.txt"),
    "src/app.ts": fixture("mit-header.ts"),
    "src/legacy.c": fixture("gpl2-header.c"),
    "src/plain.ts": "export const x = 1;\n",
    "README.md": "# Demo\n\nNothing legal here.\n",
  });
  try {
    const report = scanPath(root);
    assert.equal(report.scanned, 3);
    assert.deepEqual(report.summary, { MIT: 2, "GPL-2.0-only": 1 });
    assert.deepEqual(report.unknown, []);
    const paths = report.files.map((file) => file.path).sort();
    assert.deepEqual(paths, ["LICENSE", "src/app.ts", "src/legacy.c"]);
    assert.equal(report.files.find((f) => f.path === "LICENSE")?.kind, "license-file");
    assert.equal(report.files.find((f) => f.path === "src/app.ts")?.kind, "source-header");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("scanPath lists unknown license files and honors --fail-on-unknown data", () => {
  const root = makeProject({
    "LICENSE": fixture("unknown.txt"),
    "src/app.ts": fixture("mit-header.ts"),
  });
  try {
    const report = scanPath(root);
    assert.equal(report.scanned, 2);
    assert.deepEqual(report.summary, { MIT: 1, Unknown: 1 });
    assert.deepEqual(report.unknown, ["LICENSE"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("scanPath skips node_modules, dist and .git", () => {
  const root = makeProject({
    "LICENSE": fixture("mit.txt"),
    "node_modules/dep/LICENSE": fixture("bsd3.txt"),
    "dist/app.js": fixture("mit-header.ts"),
    ".git/config": "[core]\n",
  });
  try {
    const report = scanPath(root);
    assert.equal(report.scanned, 1);
    assert.deepEqual(report.summary, { MIT: 1 });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("scanPath respects maxDepth", () => {
  const root = makeProject({
    "LICENSE": fixture("mit.txt"),
    "a/b/c/d/LICENSE": fixture("bsd3.txt"),
  });
  try {
    assert.equal(scanPath(root, { maxDepth: 0 }).scanned, 1);
    assert.equal(scanPath(root, { maxDepth: 4 }).scanned, 2);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("scanPath respects an extensions filter", () => {
  const root = makeProject({
    "LICENSE": fixture("mit.txt"),
    "src/app.ts": fixture("mit-header.ts"),
    "src/legacy.c": fixture("gpl2-header.c"),
  });
  try {
    const report = scanPath(root, { extensions: ["ts"] });
    assert.equal(report.scanned, 2);
    assert.deepEqual(report.summary, { MIT: 2 });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("scanPath throws on a missing path", () => {
  assert.throws(() => scanPath(join(tmpdir(), "definitely-not-here-license-detector")), /no such file/);
});

test("a single file can be scanned as the target", () => {
  const root = makeProject({ "LICENSE": fixture("bsd3.txt") });
  try {
    const report = scanPath(join(root, "LICENSE"));
    assert.equal(report.scanned, 1);
    assert.deepEqual(report.summary, { "BSD-3-Clause": 1 });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
