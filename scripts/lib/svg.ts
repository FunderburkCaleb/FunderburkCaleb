/** Tiny SVG string helpers — no rendering lib, just disciplined templates. */

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Greedy word-wrap for a fixed pixel width, assuming a monospace-ish advance.
 * charW ≈ fontSize * 0.6 for the system mono stack.
 */
export function wrap(text: string, maxWidthPx: number, fontSize: number, maxLines: number): string[] {
  const charW = fontSize * 0.6;
  const maxChars = Math.max(1, Math.floor(maxWidthPx / charW));
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= maxChars) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
    if (lines.length === maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);

  // Ellipsize if we ran out of room.
  if (lines.length === maxLines) {
    const last = lines[maxLines - 1]!;
    const consumed = lines.join(" ").length;
    if (consumed < text.length && last.length > 1) {
      lines[maxLines - 1] = `${last.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
    }
  }
  return lines;
}

/** Collapse insignificant whitespace so byte weight stays inside the §5 budget. */
export function minifySvg(svg: string): string {
  return svg
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .trim();
}
