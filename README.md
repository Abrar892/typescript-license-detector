# license-detector

A zero-dependency CLI that identifies the software license of a file or a
whole project — the kind of check you run before vendoring a dependency,
auditing a monorepo, or wiring license compliance into CI.

```sh
license-detector LICENSE
# LICENSE: MIT (MIT License), confidence 1.00 via anchor — 2024 Example Corp

license-detector ./my-project
license-detector --json ./my-project
license-detector --threshold 0.7 --fail-on-unknown ./my-project
```

It knows 12 licenses (MIT, Apache-2.0, BSD-2/3-Clause, ISC, GPL-2.0/3.0,
LGPL-3.0, AGPL-3.0, MPL-2.0, Unlicense, CC0-1.0) and reports the SPDX
identifier, a confidence score, how the match was made, and any copyright
holders it found.

## Why this exists

License text is messy in practice. The same MIT license shows up as a bare
`LICENSE` file, a `//` comment header, a JSDoc block, or a one-line
`SPDX-License-Identifier:` tag — and projects mix licenses across files.
Grepping for "MIT" is not a detector: it misses reworded headers and
mislabels BSD-2 as BSD-3. This tool treats identification as a small
classification problem instead.

## How detection works

Three passes, best evidence first:

1. **SPDX** — an explicit `SPDX-License-Identifier:` line is a declaration,
   not a guess, so it wins outright at confidence 1.0.
2. **Anchors** — short phrases that appear in one license and (almost)
   nowhere else: the MIT permission grant, the Apache "TERMS AND
   CONDITIONS" heading, the BSD third clause, the GPL version preambles.
   Anchors identify a license from a short header, where a whole-text
   comparison has too little to work with.
3. **Similarity** — the Dice coefficient between the input's token set and
   each license template's token set. This identifies a full `LICENSE` file
   even with a tweaked copyright line or reflowed paragraphs, and it is
   what separates near-twins: BSD-2 from BSD-3 (the third clause) and
   GPL-2.0 from GPL-3.0 (the version preamble).

A short title on its own ("MIT License", "BSD 3-Clause License") also
counts as a declaration, at confidence 0.75. Anything below the
`--threshold` (default 0.5) is reported as Unknown rather than guessed.

Before matching, text is normalized: comment markers are stripped, case is
folded, British/American spelling is unified (`licence` → `license`),
punctuation is folded to spaces. A commented header and the plain file
normalize to the same string.

## Scanning a directory

Point it at a project and it reports every license file it finds
(`LICENSE`, `LICENCE`, `COPYING`, `NOTICE`, `UNLICENSE`, ...) plus the
license header of every source file that carries one, then summarizes:

```
License scan: ./my-project
Scanned 3 files.

  LICENSE       MIT (MIT License)  [confidence 1.00 via anchor] — 2024 Example Corp
  src/app.ts    MIT (MIT License)  [confidence 0.75 via anchor] — 2026 Ada Lovelace
  src/legacy.c  GPL-2.0-only (GNU General Public License v2.0 only)  [confidence 0.50 via similarity]

Summary:
  MIT               2 files
  GPL-2.0-only      1 file
```

Source files with no license signal at all are left out — otherwise the
report would drown in "Unknown" rows for files that simply have no header.
`node_modules`, `dist`, `build`, `target`, `.git` and other generated or
hidden directories are skipped; `--max-depth` (default 4) bounds the walk
and `--extensions` limits which source files get header-scanned.

## CI gate

```sh
license-detector --fail-on-unknown ./my-project
# exit 1 if any scanned file has an unknown license, 0 otherwise
```

`--json` prints a machine-readable report (`root`, `scanned`, `summary`,
`unknown`, and per-file `license` / `confidence` / `method` / `copyright`)
for scripts and pipelines.

## Design decisions

- **Zero runtime dependencies.** License detection should work in a bare
  checkout with no install step beyond `npm install` for the toolchain.
  Everything is hand-rolled: normalization, token-set similarity, the
  directory walker, the argument parser.
- **Excerpts, not full legal texts, as templates.** The matcher needs a
  license's distinctive vocabulary, not every paragraph. Templates stay
  short, which keeps the token sets discriminating instead of washing
  every license toward the same legal boilerplate.
- **Unknown is a first-class answer.** A low-confidence guess is worse
  than no answer when the output feeds a compliance decision, so weak
  matches are reported as Unknown with their best score instead of being
  forced into the nearest license.
- **Headers are read, not whole files.** Only the first 40 lines of a
  source file are scanned: a license header lives at the top, and reading
  a 10,000-line file to find nothing would be wasteful.

## Usage

```sh
npm install
npm run build
npm test

# Single file
node dist/src/cli.js LICENSE
node dist/src/cli.js --json src/app.ts

# Whole project
node dist/src/cli.js ./my-project
node dist/src/cli.js --threshold 0.7 --fail-on-unknown ./my-project

# What can it detect?
node dist/src/cli.js --list
```

Options:

| Flag | Default | Meaning |
| ---- | ------- | ------- |
| `--json` | off | Machine-readable JSON report |
| `--threshold <n>` | `0.5` | Minimum confidence (0–1) to accept a match |
| `--fail-on-unknown` | off | Exit 1 if any scanned file is unknown |
| `--max-depth <n>` | `4` | Directory recursion depth |
| `--extensions <list>` | broad set | Comma-separated source extensions to header-scan |
| `--list` | — | Print the detectable SPDX identifiers and exit |

Exit codes: `0` when every reported file has a known license, `1` when a
file is unknown and `--fail-on-unknown` was given, `2` on usage errors.

## Tech stack

- TypeScript (strict mode), Node.js ≥ 18
- `node:test` + `node:assert/strict` — no test framework dependency
- No runtime dependencies

## License

MIT — see [LICENSE](LICENSE).
