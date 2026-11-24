/**
 * The detection engine.
 *
 * A text is identified in three passes, best evidence first:
 *
 * 1. SPDX — an explicit `SPDX-License-Identifier:` line is a declaration,
 *    not a guess, so it wins outright at confidence 1.0.
 * 2. Anchors — distinctive phrases ("permission is hereby granted, free
 *    of charge...") identify a license from a short header, where a
 *    whole-text comparison has too little to work with.
 * 3. Similarity — the Dice coefficient between the input's token set and
 *    each template's token set, plus *coverage*: the share of the input's
 *    own vocabulary the template accounts for. Coverage is the right
 *    question for a source header, which is a fragment of a license, not
 *    the whole thing; it only applies to inputs of 20+ tokens, so a
 *    four-word phrase of generic legal words cannot identify a license
 *    on its own. Similarity identifies a full LICENSE file even with a
 *    tweaked copyright line or reflowed paragraphs, and it is what
 *    separates near-twins: BSD-2 from BSD-3 (the third clause) and
 *    GPL-2.0 from GPL-3.0 (the version preamble).
 *
 * The winner is the license with the highest combined score; ties break
 * toward the higher similarity score, which is what separates near-twins
 * like BSD-2-Clause from BSD-3-Clause (the third clause) and GPL-2.0 from
 * GPL-3.0 (the version preamble).
 */

import { LICENSES, findLicense, type LicenseFamily, type LicenseTemplate } from "./licenses";
import { dice, normalize, stripCommentMarkers, tokenSet } from "./normalize";

export type DetectionMethod = "spdx" | "anchor" | "similarity" | "none";

export interface Detection {
  /** SPDX identifier, or null when nothing was identified. */
  spdx: string | null;
  name: string | null;
  family: LicenseFamily | null;
  /** 0..1. SPDX declarations are 1.0; anything below `threshold` is unknown. */
  confidence: number;
  method: DetectionMethod;
  /** Copyright holders found in the text, e.g. "2026 Jane Doe". */
  copyright: string[];
}

export const DEFAULT_THRESHOLD = 0.5;

/** Precomputed per-license matching data, built once at module load. */
interface PreparedLicense {
  license: LicenseTemplate;
  anchors: string[];
  tokens: Set<string>;
}

const PREPARED: PreparedLicense[] = LICENSES.map((license) => ({
  license,
  anchors: license.anchors.map((anchor) => normalize(anchor)),
  tokens: tokenSet(license.template),
}));

/**
 * Short title phrases that declare a license on their own, e.g. a header
 * that just says "MIT License" or "Licensed under the Apache License,
 * Version 2.0". A title is a declaration, so a hit scores 0.75 — below a
 * full-text match, above the unknown threshold, and never enough on its
 * own to beat a license whose anchors actually fired.
 */
const TITLES: Record<string, string[]> = {
  "MIT": ["mit license"],
  "Apache-2.0": ["apache license version 2 0", "apache license 2 0"],
  "BSD-3-Clause": ["bsd 3 clause license", "bsd 3 clause"],
  "BSD-2-Clause": ["bsd 2 clause license", "bsd 2 clause"],
  "ISC": ["isc license"],
  "GPL-3.0-only": ["gnu general public license version 3", "gpl 3 0", "gplv3"],
  "GPL-2.0-only": ["gnu general public license version 2", "gpl 2 0", "gplv2"],
  "LGPL-3.0-only": ["gnu lesser general public license version 3", "lgpl 3 0", "lgplv3"],
  "AGPL-3.0-only": ["gnu affero general public license version 3", "agpl 3 0", "agplv3"],
  "MPL-2.0": ["mozilla public license version 2 0", "mozilla public license 2 0", "mpl 2 0"],
  "Unlicense": ["the unlicense"],
  "CC0-1.0": ["cc0 1 0 universal", "cc0 1 0"],
};

/** SPDX identifiers declared in a text, in order of appearance. */
export function extractSpdxIds(text: string): string[] {
  const found: string[] = [];
  const pattern = /SPDX-License-Identifier:\s*([A-Za-z0-9.:\-+]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const id = match[1];
    if (findLicense(id) && !found.includes(id)) found.push(id);
  }
  return found;
}

/** Copyright lines in a text, e.g. "Copyright (c) 2026 Jane Doe". */
export function extractCopyright(text: string): string[] {
  const holders: string[] = [];
  // Only lines that *start* with a copyright notice count — "copyright"
  // mid-sentence ("the above copyright notice shall be included...") is
  // license boilerplate, not a holder. Comment markers are stripped first
  // so `// Copyright (c) 2026 X` headers match too.
  const clean = stripCommentMarkers(text);
  const pattern =
    /^\s*copyright\s+(?:\(c\)\s+)?(\d{4}(?:\s*[-–]\s*\d{4})?\s+)?(.+?)\s*$/gim;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(clean)) !== null) {
    const holder = `${match[1] ?? ""}${match[2] ?? ""}`
      .trim()
      .replace(/\s*<[^>]*>\s*$/, "")
      .replace(/[.,;]+$/, "");
    if (holder.length > 0 && holder.length <= 120 && !holders.includes(holder)) {
      holders.push(holder);
    }
  }
  return holders.slice(0, 5);
}

interface ScoredLicense {
  prepared: PreparedLicense;
  anchorScore: number;
  similarity: number;
  coverage: number;
  titleHit: boolean;
  score: number;
}

function scoreLicenses(normalized: string, tokens: Set<string>): ScoredLicense[] {
  return PREPARED.map((prepared) => {
    const matched = prepared.anchors.filter((anchor) => normalized.includes(anchor)).length;
    const anchorScore = prepared.anchors.length === 0 ? 0 : matched / prepared.anchors.length;
    const similarity = dice(tokens, prepared.tokens);
    let shared = 0;
    for (const token of tokens) {
      if (prepared.tokens.has(token)) shared++;
    }
    // Coverage: how much of the input's vocabulary the template explains.
    // Only meaningful for real fragments (20+ tokens); short inputs are
    // handled by titles and anchors instead.
    const coverage = tokens.size >= 20 ? shared / tokens.size : 0;
    const titleHit = (TITLES[prepared.license.spdx] ?? []).some((title) =>
      normalized.includes(title),
    );
    // Anchors are decisive when they fire; similarity and coverage back
    // them up and separate near-twins when anchors tie; a title alone is
    // a declaration worth 0.75.
    const score = Math.max(anchorScore, similarity, coverage, titleHit ? 0.75 : 0);
    return { prepared, anchorScore, similarity, coverage, titleHit, score };
  }).sort((a, b) => b.score - a.score || b.similarity - a.similarity);
}

/**
 * Identify the license of a text. Returns an "unknown" detection
 * (spdx null, method "none") when nothing scores at or above `threshold`.
 */
export function detectLicense(text: string, threshold = DEFAULT_THRESHOLD): Detection {
  const copyright = extractCopyright(text);

  const spdxIds = extractSpdxIds(text);
  if (spdxIds.length > 0) {
    const license = findLicense(spdxIds[0]) as LicenseTemplate;
    return {
      spdx: license.spdx,
      name: license.name,
      family: license.family,
      confidence: 1,
      method: "spdx",
      copyright,
    };
  }

  const normalized = normalize(text);
  if (normalized.length === 0) {
    return { spdx: null, name: null, family: null, confidence: 0, method: "none", copyright };
  }

  const tokens = tokenSet(text);
  const ranked = scoreLicenses(normalized, tokens);
  const best = ranked[0];
  if (!best || best.score < threshold) {
    return {
      spdx: null,
      name: null,
      family: null,
      confidence: best ? best.score : 0,
      method: "none",
      copyright,
    };
  }

  return {
    spdx: best.prepared.license.spdx,
    name: best.prepared.license.name,
    family: best.prepared.license.family,
    confidence: round(best.score),
    method: best.anchorScore >= best.similarity || best.titleHit ? "anchor" : "similarity",
    copyright,
  };
}

/** Score every known license against a text, best first (for `--list`-style inspection). */
export function rankLicenses(text: string): { spdx: string; name: string; score: number }[] {
  const normalized = normalize(text);
  const tokens = tokenSet(text);
  return scoreLicenses(normalized, tokens).map((entry) => ({
    spdx: entry.prepared.license.spdx,
    name: entry.prepared.license.name,
    score: round(entry.score),
  }));
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
