import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const ROOT = join(__dirname, "..", "..");
const CLI = join(ROOT, "dist", "src", "cli.js");
const FIXTURES = join(ROOT, "tests", "fixtures");

function run(args: string[]): { stdout: string; stderr: string; status: number | null } {
  const result = spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8" });
  return { stdout: result.stdout, stderr: result.stderr, status: result.status };
}

test("--help prints usage and exits 0", () => {
  const result = run(["--help"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage:/);
  assert.match(result.stdout, /--fail-on-unknown/);
});

test("--version prints a version", () => {
  const result = run(["--version"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout.trim(), /^\d+\.\d+\.\d+$/);
});

test("--list prints the known SPDX identifiers", () => {
  const result = run(["--list"]);
  assert.equal(result.status, 0);
  assert.ok(result.stdout.includes("MIT\n"));
  assert.ok(result.stdout.includes("Apache-2.0\n"));
  assert.ok(result.stdout.includes("GPL-3.0-only\n"));
  assert.equal(result.stdout.trim().split("\n").length, 12);
});

test("no arguments is a usage error", () => {
  const result = run([]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /a path is required/);
});

test("an unknown option is a usage error", () => {
  const result = run(["--nope", "."]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /unknown option/);
});

test("a missing path is a usage error", () => {
  const result = run([join(tmpdir(), "definitely-not-here-license-detector")]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /no such file or directory/);
});

test("a single license file prints its license and exits 0", () => {
  const mit = join(FIXTURES, "mit.txt");
  const result = run([mit]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /MIT \(MIT License\)/);
  assert.match(result.stdout, /confidence 1\.00 via anchor/);
  assert.match(result.stdout, /2024 Example Corp/);
});

test("a single unknown file reports Unknown and exits 0 by default", () => {
  const unknown = join(FIXTURES, "unknown.txt");
  const result = run([unknown]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Unknown license/);
});

test("--fail-on-unknown exits 1 for an unknown file", () => {
  const unknown = join(FIXTURES, "unknown.txt");
  const result = run(["--fail-on-unknown", unknown]);
  assert.equal(result.status, 1);
});

test("--json prints a parseable report for a directory", () => {
  const root = mkdtempSync(join(tmpdir(), "license-detector-cli-"));
  try {
    writeFileSync(join(root, "LICENSE"), readFileSync(join(FIXTURES, "mit.txt")));
    writeFileSync(join(root, "app.ts"), readFileSync(join(FIXTURES, "mit-header.ts")));
    const result = run(["--json", root]);
    assert.equal(result.status, 0);
    const report = JSON.parse(result.stdout) as {
      scanned: number;
      summary: Record<string, number>;
      files: { path: string; license: string | null }[];
    };
    assert.equal(report.scanned, 2);
    assert.deepEqual(report.summary, { MIT: 2 });
    assert.deepEqual(
      report.files.map((f) => f.path).sort(),
      ["LICENSE", "app.ts"],
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a directory scan prints a text summary", () => {
  const root = mkdtempSync(join(tmpdir(), "license-detector-cli-"));
  try {
    writeFileSync(join(root, "LICENSE"), readFileSync(join(FIXTURES, "mit.txt")));
    const result = run([root]);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /License scan:/);
    assert.match(result.stdout, /MIT \(MIT License\)/);
    assert.match(result.stdout, /Summary:/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the built CLI itself is MIT licensed (self-check)", () => {
  // The repo's own LICENSE file must be detected by the tool.
  const license = join(ROOT, "LICENSE");
  const result = run([license]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /MIT \(MIT License\)/);
});

test("execFileSync smoke test: --list works through the node binary", () => {
  const out = execFileSync(process.execPath, [CLI, "--list"], { encoding: "utf8" });
  assert.ok(out.includes("Unlicense"));
});
