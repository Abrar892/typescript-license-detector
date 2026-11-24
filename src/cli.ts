#!/usr/bin/env node
/**
 * license-detector — identify the software license of a file or project.
 *
 *   license-detector LICENSE
 *   license-detector ./my-project
 *   license-detector --json ./my-project
 *   license-detector --threshold 0.7 --fail-on-unknown ./my-project
 *
 * Exit codes: 0 when every reported file has a known license (or the
 * single target was identified), 1 when a file is unknown and
 * --fail-on-unknown was given, 2 on usage errors.
 */

import { readFileSync, statSync } from "node:fs";
import { basename } from "node:path";
import { detectLicense } from "./match";
import { formatJson, formatText } from "./report";
import { knownSpdxIds } from "./licenses";
import { scanPath } from "./scan";

const VERSION = "1.0.0";

const HELP = `license-detector ${VERSION} — identify the software license of a file or project.

Usage:
  license-detector <path> [options]

Arguments:
  <path>               A license file, a source file, or a directory to scan.

Options:
  --json               Print a machine-readable JSON report instead of text.
  --threshold <n>      Minimum confidence (0-1) to accept a match. Default 0.5.
  --fail-on-unknown    Exit 1 if any scanned file has an unknown license.
  --max-depth <n>      Directory recursion depth. Default 4.
  --extensions <list>  Comma-separated source extensions to header-scan.
                       Default: ts,tsx,js,jsx,py,java,go,cs,rb,rs,c,h,cpp,sh,php,swift,kt,scala,lua,hs,sql,css,html,vue,svelte and more.
  --list               Print the SPDX identifiers this tool can detect and exit.
  --version            Print the version and exit.
  --help               Print this help and exit.

Exit codes:
  0  every reported file has a known license
  1  unknown license found (with --fail-on-unknown)
  2  usage error`;

interface Options {
  target: string | null;
  json: boolean;
  threshold: number;
  failOnUnknown: boolean;
  maxDepth: number;
  extensions: string[] | null;
  list: boolean;
}

function parseArgs(argv: string[]): Options {
  const options: Options = {
    target: null,
    json: false,
    threshold: 0.5,
    failOnUnknown: false,
    maxDepth: 4,
    extensions: null,
    list: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--json") {
      options.json = true;
    } else if (arg === "--fail-on-unknown") {
      options.failOnUnknown = true;
    } else if (arg === "--list") {
      options.list = true;
    } else if (arg === "--help" || arg === "-h") {
      console.log(HELP);
      process.exit(0);
    } else if (arg === "--version" || arg === "-v") {
      console.log(VERSION);
      process.exit(0);
    } else if (arg === "--threshold") {
      const value = Number(argv[++i]);
      if (!Number.isFinite(value) || value < 0 || value > 1) {
        console.error("error: --threshold must be a number between 0 and 1");
        process.exit(2);
      }
      options.threshold = value;
    } else if (arg === "--max-depth") {
      const value = Number(argv[++i]);
      if (!Number.isInteger(value) || value < 0) {
        console.error("error: --max-depth must be a non-negative integer");
        process.exit(2);
      }
      options.maxDepth = value;
    } else if (arg === "--extensions") {
      const raw = argv[++i];
      if (raw === undefined) {
        console.error("error: --extensions needs a comma-separated list");
        process.exit(2);
      }
      options.extensions = raw.split(",").map((ext) => ext.trim()).filter(Boolean);
    } else if (arg.startsWith("-")) {
      console.error(`error: unknown option ${arg}`);
      console.error("Run with --help for usage.");
      process.exit(2);
    } else if (options.target === null) {
      options.target = arg;
    } else {
      console.error(`error: unexpected argument ${arg} (one path only)`);
      process.exit(2);
    }
  }
  return options;
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));

  if (options.list) {
    for (const id of knownSpdxIds()) console.log(id);
    return;
  }

  if (options.target === null) {
    console.error("error: a path is required");
    console.error("Run with --help for usage.");
    process.exit(2);
  }

  let isDir: boolean;
  try {
    isDir = statSync(options.target).isDirectory();
  } catch {
    console.error(`error: no such file or directory: ${options.target}`);
    process.exit(2);
  }

  if (!isDir) {
    const text = readFileSync(options.target, "utf8");
    const detection = detectLicense(text, options.threshold);
    if (options.json) {
      console.log(
        JSON.stringify(
          {
            path: options.target,
            license: detection.spdx,
            name: detection.name,
            family: detection.family,
            confidence: detection.confidence,
            method: detection.method,
            copyright: detection.copyright,
          },
          null,
          2,
        ),
      );
    } else if (detection.spdx === null) {
      console.log(`${basename(options.target)}: Unknown license (best score ${detection.confidence.toFixed(2)})`);
    } else {
      const holder =
        detection.copyright.length > 0 ? ` — ${detection.copyright.join("; ")}` : "";
      console.log(
        `${basename(options.target)}: ${detection.spdx} (${detection.name}), confidence ${detection.confidence.toFixed(2)} via ${detection.method}${holder}`,
      );
    }
    process.exit(detection.spdx === null && options.failOnUnknown ? 1 : 0);
  }

  let report;
  try {
    report = scanPath(options.target, {
      threshold: options.threshold,
      maxDepth: options.maxDepth,
      extensions: options.extensions ?? undefined,
    });
  } catch (error) {
    console.error(`error: ${(error as Error).message}`);
    process.exit(2);
  }

  console.log(options.json ? formatJson(report) : formatText(report));
  process.exit(report.unknown.length > 0 && options.failOnUnknown ? 1 : 0);
}

main();
