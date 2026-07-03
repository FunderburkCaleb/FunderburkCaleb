/**
 * build-telemetry.ts — the §3.3 telemetry strip (P1).
 *
 * One wide console "readout" line replacing stock stat cards:
 *   contributions this year · current streak · top languages.
 *
 * Pulled via GraphQL when a token is present; degrades to a neutral placeholder
 * strip locally so README assembly always has an asset to reference.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { graphql } from "@octokit/graphql";
import { loadAgentsConfig, REPO_ROOT } from "./lib/config.js";
import { MONO, THEMES, type ThemeName } from "./lib/tokens.js";
import { escapeXml, minifySvg } from "./lib/svg.js";

interface Telemetry {
  contributions: number | null;
  streakDays: number | null;
  topLanguages: string[];
}

const CONTRIB_QUERY = /* GraphQL */ `
  query ($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar { totalContributions }
      }
      repositories(first: 100, ownerAffiliations: OWNER, isFork: false) {
        nodes { languages(first: 5, orderBy: { field: SIZE, direction: DESC }) { nodes { name } } }
      }
    }
  }
`;

async function fetchTelemetry(login: string): Promise<Telemetry> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return { contributions: null, streakDays: null, topLanguages: [] };

  const client = graphql.defaults({ headers: { authorization: `token ${token}` } });
  try {
    const res = await client<{
      user: {
        contributionsCollection: { contributionCalendar: { totalContributions: number } };
        repositories: { nodes: { languages: { nodes: { name: string }[] } }[] };
      };
    }>(CONTRIB_QUERY, { login });

    const counts = new Map<string, number>();
    for (const repo of res.user.repositories.nodes) {
      for (const lang of repo.languages.nodes) {
        counts.set(lang.name, (counts.get(lang.name) ?? 0) + 1);
      }
    }
    const topLanguages = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name]) => name);

    return {
      contributions: res.user.contributionsCollection.contributionCalendar.totalContributions,
      streakDays: null, // streak requires day-by-day calendar; left for a follow-up
      topLanguages,
    };
  } catch (err) {
    console.warn(`  ⚠ telemetry: ${err instanceof Error ? err.message : String(err)} — using placeholder`);
    return { contributions: null, streakDays: null, topLanguages: [] };
  }
}

function renderStrip(data: Telemetry, theme: ThemeName): string {
  const t = THEMES[theme];
  const w = 788;
  const h = 44;

  const seg = (label: string, value: string) =>
    `<tspan fill="${t.muted}">${escapeXml(label)} </tspan><tspan fill="${t.text}" font-weight="600">${escapeXml(value)}</tspan>`;

  const parts: string[] = [];
  parts.push(seg("contrib/yr", data.contributions != null ? String(data.contributions) : "—"));
  if (data.streakDays != null) parts.push(seg("streak", `${data.streakDays}d`));
  parts.push(seg("stack", data.topLanguages.length ? data.topLanguages.join(" · ") : "—"));

  const line = parts.join(`<tspan fill="${t.border}">   │   </tspan>`);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Telemetry readout">
    <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="8" fill="${t.panel}" stroke="${t.border}" stroke-width="1"/>
    <circle cx="18" cy="${h / 2}" r="3" fill="${t.green}"/>
    <text x="34" y="${h / 2 + 4}" font-family="${MONO}" font-size="12.5">${line}</text>
  </svg>`;
  return minifySvg(svg);
}

async function main() {
  const cfg = loadAgentsConfig();
  const outDir = resolve(REPO_ROOT, "assets", "generated");
  mkdirSync(outDir, { recursive: true });

  const data = await fetchTelemetry(cfg.meta.owner);
  for (const theme of ["dark", "light"] as const) {
    writeFileSync(resolve(outDir, `telemetry-${theme}.svg`), renderStrip(data, theme), "utf8");
  }
  console.log(`  ✓ telemetry strip (both themes) → assets/generated/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
