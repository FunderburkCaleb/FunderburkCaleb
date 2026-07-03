/**
 * Agent card SVG (§3.2) — the signature element.
 *
 *   ┌─ AGENT: copilot-studio-cookbook ────────┐
 *   │ ● ACTIVE          v1.2 · updated 3d ago │
 *   │ Adaptive Cards + Power Fx patterns      │
 *   │ that aren't documented anywhere else    │
 *   │ → 47 ⭐  · 12 forks                      │
 *   └─────────────────────────────────────────┘
 *
 * A left domain rail carries the per-domain accent tint (§4). Status dots are
 * drawn as shapes (not glyphs) so they render identically everywhere.
 */

import type { AgentConfig } from "./config.js";
import type { ResolvedCard, Status } from "./status.js";
import type { Theme, ThemeName } from "./tokens.js";
import { DOMAIN_ACCENT, MONO, SANS, THEMES } from "./tokens.js";
import { escapeXml, minifySvg, wrap } from "./svg.js";

const NORMAL_W = 388;
const FEATURED_W = 788; // spans two normal columns + gap
const H = 156;
const PAD = 16;
const RAIL = 4;

function statusColor(status: Status, t: Theme): string {
  if (status === "active") return t.green;
  if (status === "building") return t.amber;
  return t.muted;
}

function statusLabel(status: Status): string {
  return status.toUpperCase();
}

/** Status dot as geometry: active = filled, building = half, planned = ring. */
function statusDot(cx: number, cy: number, color: string, status: Status): string {
  const r = 5;
  if (status === "active") {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>`;
  }
  if (status === "building") {
    return (
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="1.5"/>` +
      `<path d="M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} Z" fill="${color}"/>`
    );
  }
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="1.5"/>`;
}

export function renderCard(
  agent: AgentConfig,
  card: ResolvedCard,
  theme: ThemeName,
): string {
  const t = THEMES[theme];
  const accent = DOMAIN_ACCENT[agent.domain];
  const w = agent.featured ? FEATURED_W : NORMAL_W;
  const innerLeft = PAD + RAIL + 8;
  const innerRight = w - PAD;
  const textWidth = innerRight - innerLeft;

  const sColor = statusColor(card.status, t);

  // Right-aligned meta: "v1.2 · updated 3d ago" (omit missing parts gracefully).
  const metaParts = [card.version, card.updatedLabel].filter(Boolean) as string[];
  const meta = metaParts.join(" · ");

  const taglineLines = wrap(agent.tagline, textWidth, 13, agent.featured ? 2 : 2);

  const statsLine =
    agent.show_stats && card.linked
      ? `→ ${card.stars} ★  ·  ${card.forks} forks`
      : agent.show_stats && !card.linked
        ? "→ repo pending"
        : "";

  const startHere = agent.featured && agent.start_here && card.linked ? agent.start_here : "";

  let y = PAD + 6;

  // Header line: "AGENT: <id>"
  const header =
    `<text x="${innerLeft}" y="${y + 10}" font-family="${MONO}" font-size="12" ` +
    `fill="${t.muted}" letter-spacing="0.5">AGENT: ` +
    `<tspan fill="${t.text}" font-weight="600">${escapeXml(agent.id)}</tspan></text>`;

  // Hairline under header.
  y += 22;
  const rule = `<line x1="${innerLeft}" y1="${y}" x2="${innerRight}" y2="${y}" stroke="${t.border}" stroke-width="1"/>`;

  // Status row.
  y += 22;
  const dot = statusDot(innerLeft + 5, y - 4, sColor, card.status);
  const status =
    `${dot}<text x="${innerLeft + 16}" y="${y}" font-family="${MONO}" font-size="12.5" ` +
    `font-weight="600" fill="${sColor}" letter-spacing="0.5">${statusLabel(card.status)}</text>` +
    (meta
      ? `<text x="${innerRight}" y="${y}" text-anchor="end" font-family="${MONO}" ` +
        `font-size="11.5" fill="${t.muted}">${escapeXml(meta)}</text>`
      : "");

  // Tagline (human-readable sans).
  y += 24;
  const tagline = taglineLines
    .map((line, i) => {
      const ly = y + i * 17;
      return `<text x="${innerLeft}" y="${ly}" font-family="${SANS}" font-size="13" fill="${t.text}">${escapeXml(line)}</text>`;
    })
    .join("");
  y += (taglineLines.length - 1) * 17;

  // Stats / start-here row, pinned near the bottom.
  const bottomY = H - PAD - 2;
  const stats = statsLine
    ? `<text x="${innerLeft}" y="${bottomY}" font-family="${MONO}" font-size="12" fill="${t.muted}">${escapeXml(statsLine)}</text>`
    : "";
  const cta = startHere
    ? `<text x="${innerRight}" y="${bottomY}" text-anchor="end" font-family="${MONO}" font-size="12" font-weight="600" fill="${accent}">${escapeXml(startHere)}</text>`
    : "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${H}" viewBox="0 0 ${w} ${H}" role="img" aria-label="Agent card: ${escapeXml(agent.id)}, ${card.status}">
    <rect x="0.5" y="0.5" width="${w - 1}" height="${H - 1}" rx="8" fill="${t.panel}" stroke="${t.border}" stroke-width="1"/>
    <rect x="${PAD}" y="${PAD}" width="${RAIL}" height="${H - PAD * 2}" rx="2" fill="${accent}"/>
    ${header}
    ${rule}
    ${status}
    ${tagline}
    ${stats}
    ${cta}
  </svg>`;

  return minifySvg(svg);
}

export const CARD_DIMS = { NORMAL_W, FEATURED_W, H };
