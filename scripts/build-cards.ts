/**
 * build-cards.ts — GraphQL → repo data → agent-card SVGs (both themes).
 *
 * Writes:
 *   assets/generated/<id>-dark.svg
 *   assets/generated/<id>-light.svg
 *   assets/generated/cards.json   (manifest consumed by assemble-readme.ts)
 *
 * Never fails the whole build on a single missing repo (§4.1).
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadAgentsConfig, REPO_ROOT } from "./lib/config.js";
import { fetchRepo, hasToken } from "./lib/github.js";
import { resolveCard } from "./lib/status.js";
import { renderCard } from "./lib/card.js";

export interface CardManifestEntry {
  id: string;
  order: number;
  domain: string;
  featured: boolean;
  status: string;
  linked: boolean;
  url: string | null;
}

async function main() {
  const cfg = loadAgentsConfig();
  const now = Date.now();
  const outDir = resolve(REPO_ROOT, "assets", "generated");
  mkdirSync(outDir, { recursive: true });

  if (!hasToken()) {
    console.warn("⚠ No GITHUB_TOKEN — building from config only (statuses from overrides, stats suppressed).");
  }

  const manifest: CardManifestEntry[] = [];

  for (const agent of cfg.agents) {
    const repo = await fetchRepo(cfg.meta.owner, agent.id);
    const card = resolveCard(agent, repo, cfg.rules, now);

    for (const theme of ["dark", "light"] as const) {
      const svg = renderCard(agent, card, theme);
      writeFileSync(resolve(outDir, `${agent.id}-${theme}.svg`), svg, "utf8");
    }

    manifest.push({
      id: agent.id,
      order: agent.order,
      domain: agent.domain,
      featured: agent.featured,
      status: card.status,
      linked: card.linked,
      url: card.linked ? `https://github.com/${cfg.meta.owner}/${agent.id}` : null,
    });

    const flag = card.linked ? "" : "  (unlinked)";
    console.log(`  ✓ ${agent.id.padEnd(26)} ${card.status.toUpperCase().padEnd(9)}${flag}`);
  }

  writeFileSync(resolve(outDir, "cards.json"), JSON.stringify(manifest, null, 2), "utf8");
  console.log(`\nGenerated ${manifest.length * 2} card SVGs + manifest → assets/generated/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
