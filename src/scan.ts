/**
 * Directory scanning: find license files and source-file headers in a
 * project tree and identify each one.
 *
 * A project usually declares its license in exactly one place — a LICENSE
 * file at the root — but headers drift: a vendored file keeps its own
 * BSD header, a generated file carries none. Scanning both the license
 * files and the source headers, then summarizing, is what makes the
 * report useful instead of a single yes/no.
 */

import { existsSync, lstatSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, extname, join, relative, resolve } from "node:path";
import { DEFAULT_THRESHOLD, detectLicense, type Detection } from "./match";

export type FileKind = "license-file" | "source-header";

export interface FileResult {
  /** Path relative to the scanned root. */
  path: string;
  kind: FileKind;
  detection: Detection;
}

export interface ScanReport {
  root: string;
  files: FileResult[];
  /** Count of files per SPDX id; "Unknown" for unidentified files. */
  summary: Record<string, number>;
  unknown: string[];
  scanned: number;
}

export interface ScanOptions {
  threshold?: number;
  /** How deep to recurse (0 = root only). Default 4. */
  maxDepth?: number;
  /** Source extensions to header-scan. Default: a broad common set. */
  extensions?: string[];
  /** Maximum header lines read from a source file. Default 40. */
  headerLines?: number;
}

const LICENSE_BASENAMES = ["license", "licence", "copying", "copyright", "notice", "unlicense"];

const SKIP_DIRS = new Set([
  ".git",
  ".hg",
  ".svn",
  "node_modules",
  "dist",
  "build",
  "out",
  "target",
  "vendor",
  "__pycache__",
  ".venv",
  "venv",
  ".idea",
  ".vscode",
]);

export const DEFAULT_EXTENSIONS = [
  "ts",
  "tsx",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "py",
  "java",
  "go",
  "cs",
  "rb",
  "rs",
  "c",
  "h",
  "cpp",
  "hpp",
  "cc",
  "sh",
  "php",
  "swift",
  "kt",
  "kts",
  "scala",
  "lua",
  "hs",
  "ml",
  "clj",
  "ex",
  "exs",
  "erl",
  "fs",
  "ps1",
  "pl",
  "r",
  "sql",
  "css",
  "scss",
  "html",
  "vue",
  "svelte",
];

function isLicenseFileName(name: string): boolean {
  const lower = name.toLowerCase();
  const stem = lower.split(".")[0];
  return LICENSE_BASENAMES.includes(stem) || LICENSE_BASENAMES.includes(lower);
}

function isBinary(buffer: Buffer): boolean {
  // NUL byte in the first kilobyte is a reliable binary signal.
  return buffer.subarray(0, 1024).includes(0);
}

function walk(dir: string, depth: number, maxDepth: number, out: string[]): void {
  if (depth > maxDepth) return;
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries.sort()) {
    // Hidden files and directories are noise for a license scan.
    if (entry.startsWith(".")) continue;
    const full = join(dir, entry);
    let stat;
    try {
      stat = lstatSync(full);
    } catch {
      continue;
    }
    if (stat.isSymbolicLink()) continue;
    if (stat.isDirectory()) {
      if (SKIP_DIRS.has(entry)) continue;
      walk(full, depth + 1, maxDepth, out);
    } else if (stat.isFile()) {
      out.push(full);
    }
  }
}

/** Identify the license of a single file: whole file for license files, header only for source. */
export function detectFile(filePath: string, threshold = DEFAULT_THRESHOLD): Detection {
  const buffer = readFileSync(filePath);
  if (isBinary(buffer)) {
    return { spdx: null, name: null, family: null, confidence: 0, method: "none", copyright: [] };
  }
  const text = buffer.toString("utf8");
  if (isLicenseFileName(basename(filePath))) {
    return detectLicense(text, threshold);
  }
  const header = text.split("\n").slice(0, 40).join("\n");
  return detectLicense(header, threshold);
}

/** Scan a file or a directory and report every license found. */
export function scanPath(target: string, options: ScanOptions = {}): ScanReport {
  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  const maxDepth = options.maxDepth ?? 4;
  const extensions = new Set(
    (options.extensions ?? DEFAULT_EXTENSIONS).map((ext) => ext.replace(/^\./, "").toLowerCase()),
  );
  const root = resolve(target);

  if (!existsSync(root)) {
    throw new Error(`no such file or directory: ${target}`);
  }

  const files: FileResult[] = [];
  const candidates: string[] = [];
  if (statSync(root).isFile()) {
    candidates.push(root);
  } else {
    walk(root, 0, maxDepth, candidates);
  }

  for (const full of candidates) {
    const name = basename(full);
    const ext = extname(name).replace(/^\./, "").toLowerCase();
    const rel = relative(root, full) || name;
    if (isLicenseFileName(name)) {
      files.push({ path: rel, kind: "license-file", detection: detectFile(full, threshold) });
    } else if (extensions.has(ext)) {
      const detection = detectFile(full, threshold);
      // A source file with no license signal at all is not worth listing:
      // it would drown the report in "Unknown" rows. Only files that
      // mention a license (or a copyright line) make the cut.
      if (detection.spdx !== null || detection.copyright.length > 0) {
        files.push({ path: rel, kind: "source-header", detection });
      }
    }
  }

  const summary: Record<string, number> = {};
  const unknown: string[] = [];
  for (const file of files) {
    const key = file.detection.spdx ?? "Unknown";
    summary[key] = (summary[key] ?? 0) + 1;
    if (file.detection.spdx === null) unknown.push(file.path);
  }

  return { root, files, summary, unknown, scanned: files.length };
}
