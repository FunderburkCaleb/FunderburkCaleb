/** Load + validate config/agents.yml against the §4.1 schema. */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { parse } from "yaml";
import type { Domain } from "./tokens.js";
import { DOMAIN_ACCENT } from "./tokens.js";

export type StatusOverride = "auto" | "active" | "building" | "planned";

export interface AgentConfig {
  id: string;
  order: number;
  tagline: string;
  domain: Domain;
  status: StatusOverride;
  show_stats: boolean;
  featured: boolean;
  start_here?: string;
}

export interface Meta {
  owner: string;
  site: string;
  timezone: string;
  card_theme_pair: boolean;
}

export interface Rules {
  active_window_days: number;
  promote_on_first_release: boolean;
}

export interface AgentsFile {
  meta: Meta;
  agents: AgentConfig[];
  rules: Rules;
}

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(HERE, "..", "..");

const VALID_DOMAINS = new Set(Object.keys(DOMAIN_ACCENT));
const VALID_STATUS = new Set(["auto", "active", "building", "planned"]);

export function loadAgentsConfig(
  path = resolve(REPO_ROOT, "config", "agents.yml"),
): AgentsFile {
  const raw = parse(readFileSync(path, "utf8")) as Partial<AgentsFile>;

  if (!raw?.meta?.owner) throw new Error("agents.yml: meta.owner is required");
  if (!Array.isArray(raw.agents) || raw.agents.length === 0) {
    throw new Error("agents.yml: at least one agent is required");
  }

  const agents: AgentConfig[] = raw.agents.map((a, i) => {
    const where = `agents[${i}] (${a?.id ?? "?"})`;
    if (!a.id) throw new Error(`${where}: id is required (must match repo name)`);
    if (typeof a.order !== "number") throw new Error(`${where}: order must be a number`);
    if (!a.tagline) throw new Error(`${where}: tagline is required`);
    if (!VALID_DOMAINS.has(a.domain)) {
      throw new Error(`${where}: domain "${a.domain}" not in enum ${[...VALID_DOMAINS].join(" | ")}`);
    }
    const status = (a.status ?? "auto") as StatusOverride;
    if (!VALID_STATUS.has(status)) throw new Error(`${where}: invalid status "${status}"`);
    return {
      id: a.id,
      order: a.order,
      tagline: a.tagline,
      domain: a.domain,
      status,
      show_stats: a.show_stats ?? true,
      featured: a.featured ?? false,
      start_here: a.start_here,
    };
  });

  // Deterministic grid order.
  agents.sort((x, y) => x.order - y.order);

  const featuredCount = agents.filter((a) => a.featured).length;
  if (featuredCount > 1) {
    throw new Error(`agents.yml: only one agent may be featured (found ${featuredCount})`);
  }

  return {
    meta: {
      owner: raw.meta.owner,
      site: raw.meta.site ?? "",
      timezone: raw.meta.timezone ?? "America/New_York",
      card_theme_pair: raw.meta.card_theme_pair ?? true,
    },
    agents,
    rules: {
      active_window_days: raw.rules?.active_window_days ?? 30,
      promote_on_first_release: raw.rules?.promote_on_first_release ?? true,
    },
  };
}
