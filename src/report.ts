/**
 * Report formatting: a human-readable text summary and a JSON form for
 * scripts and CI.
 */

import type { ScanReport } from "./scan";

function pad(text: string, width: number): string {
  return text.length >= width ? text : text + " ".repeat(width - text.length);
}

export function formatText(report: ScanReport): string {
  const lines: string[] = [];
  lines.push(`License scan: ${report.root}`);
  lines.push(`Scanned ${report.scanned} file${report.scanned === 1 ? "" : "s"}.`);
  lines.push("");

  if (report.files.length === 0) {
    lines.push("No license files or licensed source headers found.");
    return lines.join("\n");
  }

  const width = Math.max(...report.files.map((file) => file.path.length));
  for (const file of report.files) {
    const detection = file.detection;
    const label =
      detection.spdx === null
        ? "Unknown"
        : `${detection.spdx} (${detection.name})`;
    const confidence = `confidence ${detection.confidence.toFixed(2)} via ${detection.method}`;
    const holder =
      detection.copyright.length > 0 ? ` — ${detection.copyright.join("; ")}` : "";
    lines.push(`  ${pad(file.path, width)}  ${label}  [${confidence}]${holder}`);
  }

  lines.push("");
  lines.push("Summary:");
  for (const [spdx, count] of Object.entries(report.summary).sort((a, b) => b[1] - a[1])) {
    lines.push(`  ${pad(spdx, 16)} ${count} file${count === 1 ? "" : "s"}`);
  }
  if (report.unknown.length > 0) {
    lines.push("");
    lines.push(`Unknown license in ${report.unknown.length} file${report.unknown.length === 1 ? "" : "s"}:`);
    for (const path of report.unknown) lines.push(`  ${path}`);
  }
  return lines.join("\n");
}

export function formatJson(report: ScanReport): string {
  return JSON.stringify(
    {
      root: report.root,
      scanned: report.scanned,
      summary: report.summary,
      unknown: report.unknown,
      files: report.files.map((file) => ({
        path: file.path,
        kind: file.kind,
        license: file.detection.spdx,
        name: file.detection.name,
        family: file.detection.family,
        confidence: file.detection.confidence,
        method: file.detection.method,
        copyright: file.detection.copyright,
      })),
    },
    null,
    2,
  );
}
