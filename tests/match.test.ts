import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { detectLicense, extractCopyright, extractSpdxIds, rankLicenses } from "../src/match";
import { LICENSES } from "../src/licenses";

const fixtures = join(__dirname, "..", "..", "tests", "fixtures");

function fixture(name: string): string {
  return readFileSync(join(fixtures, name), "utf8");
}

test("identifies a full MIT license file", () => {
  const detection = detectLicense(fixture("mit.txt"));
  assert.equal(detection.spdx, "MIT");
  assert.equal(detection.method, "anchor");
  assert.ok(detection.confidence >= 0.9);
  assert.deepEqual(detection.copyright, ["2024 Example Corp"]);
});

test("identifies an Apache-2.0 excerpt", () => {
  const detection = detectLicense(fixture("apache-excerpt.txt"));
  assert.equal(detection.spdx, "Apache-2.0");
  assert.ok(detection.confidence >= 0.6);
});

test("identifies a GPL-3.0 excerpt", () => {
  const detection = detectLicense(fixture("gpl3-excerpt.txt"));
  assert.equal(detection.spdx, "GPL-3.0-only");
  assert.ok(detection.confidence >= 0.7);
  assert.deepEqual(detection.copyright, ["2007 Free Software Foundation, Inc"]);
});

test("identifies a full BSD-3-Clause license", () => {
  const detection = detectLicense(fixture("bsd3.txt"));
  assert.equal(detection.spdx, "BSD-3-Clause");
  assert.ok(detection.confidence >= 0.9);
});

test("identifies a full ISC license", () => {
  const detection = detectLicense(fixture("isc.txt"));
  assert.equal(detection.spdx, "ISC");
  assert.ok(detection.confidence >= 0.9);
});

test("identifies the Unlicense", () => {
  const detection = detectLicense(fixture("unlicense.txt"));
  assert.equal(detection.spdx, "Unlicense");
  assert.equal(detection.family, "public-domain");
  assert.ok(detection.confidence >= 0.9);
});

test("identifies every catalog license from its own template", () => {
  for (const license of LICENSES) {
    const detection = detectLicense(license.template);
    assert.equal(detection.spdx, license.spdx, `template of ${license.spdx} misidentified`);
    assert.ok(detection.confidence >= 0.9, `${license.spdx} confidence too low`);
  }
});

test("separates BSD-2-Clause from BSD-3-Clause", () => {
  const bsd2 = LICENSES.find((lic) => lic.spdx === "BSD-2-Clause")!;
  const bsd3 = LICENSES.find((lic) => lic.spdx === "BSD-3-Clause")!;
  assert.equal(detectLicense(bsd2.template).spdx, "BSD-2-Clause");
  assert.equal(detectLicense(bsd3.template).spdx, "BSD-3-Clause");
});

test("separates GPL-2.0 from GPL-3.0", () => {
  const gpl2 = LICENSES.find((lic) => lic.spdx === "GPL-2.0-only")!;
  const gpl3 = LICENSES.find((lic) => lic.spdx === "GPL-3.0-only")!;
  assert.equal(detectLicense(gpl2.template).spdx, "GPL-2.0-only");
  assert.equal(detectLicense(gpl3.template).spdx, "GPL-3.0-only");
});

test("identifies a license from a commented source header", () => {
  const detection = detectLicense(fixture("mit-header.ts"));
  assert.equal(detection.spdx, "MIT");
  assert.deepEqual(detection.copyright, ["2026 Ada Lovelace"]);
});

test("identifies GPL-2.0 from a short C header that only names the version", () => {
  const detection = detectLicense(fixture("gpl2-header.c"));
  assert.equal(detection.spdx, "GPL-2.0-only");
});

test("identifies a license from a bare title line", () => {
  assert.equal(detectLicense("MIT License").spdx, "MIT");
  assert.equal(detectLicense("Licensed under the Apache License, Version 2.0").spdx, "Apache-2.0");
  assert.equal(detectLicense("BSD 3-Clause License").spdx, "BSD-3-Clause");
  assert.equal(detectLicense("BSD 2-Clause License").spdx, "BSD-2-Clause");
  assert.equal(detectLicense("ISC License").spdx, "ISC");
  assert.equal(detectLicense("Mozilla Public License 2.0").spdx, "MPL-2.0");
});

test("an SPDX identifier wins outright at confidence 1.0", () => {
  const detection = detectLicense("// SPDX-License-Identifier: Apache-2.0\n// some code");
  assert.equal(detection.spdx, "Apache-2.0");
  assert.equal(detection.confidence, 1);
  assert.equal(detection.method, "spdx");
});

test("extractSpdxIds finds declared identifiers and ignores unknown ones", () => {
  assert.deepEqual(extractSpdxIds("SPDX-License-Identifier: MIT"), ["MIT"]);
  assert.deepEqual(extractSpdxIds("SPDX-License-Identifier: MIT OR Apache-2.0"), ["MIT"]);
  assert.deepEqual(extractSpdxIds("SPDX-License-Identifier: Not-A-License"), []);
  assert.deepEqual(extractSpdxIds("no identifier here"), []);
});

test("returns unknown for ordinary prose", () => {
  const detection = detectLicense(fixture("unknown.txt"));
  assert.equal(detection.spdx, null);
  assert.equal(detection.method, "none");
});

test("returns unknown for empty input", () => {
  const detection = detectLicense("   \n\n  ");
  assert.equal(detection.spdx, null);
  assert.equal(detection.confidence, 0);
});

test("a high threshold rejects weak matches", () => {
  const detection = detectLicense("MIT License", 0.9);
  assert.equal(detection.spdx, null);
  assert.ok(detection.confidence < 0.9);
});

test("extractCopyright pulls holders and years", () => {
  const holders = extractCopyright(
    "Copyright (c) 2019-2024 Jane Doe\nCopyright 2020 John Smith\nSome other line",
  );
  assert.deepEqual(holders, ["2019-2024 Jane Doe", "2020 John Smith"]);
});

test("rankLicenses puts the right license first", () => {
  const ranked = rankLicenses(fixture("mit.txt"));
  assert.equal(ranked[0].spdx, "MIT");
  assert.ok(ranked[0].score > ranked[1].score);
  assert.equal(ranked.length, LICENSES.length);
});
