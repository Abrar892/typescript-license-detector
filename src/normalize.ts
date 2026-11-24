/**
 * Text normalization for license fingerprinting.
 *
 * License text shows up in many shapes — a bare LICENSE file, a `//`
 * comment header, a `#` shell header, a JSDoc block, a README mention —
 * but the words are the same. Normalization strips the packaging so the
 * matcher compares words, not formatting.
 */

/** Remove per-line comment markers (`//`, `#`, `*`, `<!-- -->`, ...) from a text. */
export function stripCommentMarkers(text: string): string {
  return text
    .split("\n")
    .map((raw) => {
      let line = raw.trim();
      line = line.replace(/^\/\*+/, "");
      line = line.replace(/\*+\/$/, "");
      line = line.replace(/^<!--/, "").replace(/-->$/, "");
      line = line.replace(/^(\/\/|#|;|%|\*)\s?/, "");
      line = line.replace(/\*\/\s*$/, "");
      return line.trim();
    })
    .join("\n");
}

/**
 * Canonical form of a license text: comment markers removed, lowercased,
 * British/American spelling unified, punctuation folded to spaces and
 * whitespace collapsed. Two copies of the same license normalize to the
 * same string even if one is a comment header and the other a plain file.
 */
export function normalize(text: string): string {
  return stripCommentMarkers(text)
    .toLowerCase()
    .replace(/licence/g, "license")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** The set of distinct words in a text, after normalization. */
export function tokenSet(text: string): Set<string> {
  const normalized = normalize(text);
  return new Set(normalized.length === 0 ? [] : normalized.split(" "));
}

/**
 * Dice coefficient between two token sets: 2|A ∩ B| / (|A| + |B|).
 * 1 means identical vocabularies, 0 means nothing in common. Unlike a
 * plain Jaccard index it rewards overlap relative to the smaller text,
 * which matters when comparing a short header against a long template.
 */
export function dice(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const token of a) {
    if (b.has(token)) shared++;
  }
  return (2 * shared) / (a.size + b.size);
}
