/**
 * Status derivation (§4.1).
 *
 *   status: auto  → repo has a release tag AND pushed within active_window_days → active
 *                 → repo exists, no release tag                                 → building
 *                 → repo 404s                                                   → planned (+ warn upstream)
 *   status: <explicit>  → honored as-is, but never claims "active" for a repo that doesn't exist.
 *
 * `promote_on_first_release` (P1): a repo the config marks `building` is promoted to
 * `active` once it actually has a release tag.
 */

import type { AgentConfig, Rules } from "./config.js";
import type { RepoData } from "./github.js";

export type Status = "active" | "building" | "planned";

export interface ResolvedCard {
  status: Status;
  /** Human "updated 3d ago" string, or null when unknown/planned. */
  updatedLabel: string | null;
  version: string | null;
  stars: number;
  forks: number;
  /** Whether the card should link to a real repo. */
  linked: boolean;
}

const DAY_MS = 86_400_000;

function daysSince(iso: string, now: number): number {
  return (now - Date.parse(iso)) / DAY_MS;
}

export function relativeTime(iso: string, now: number): string {
  const d = Math.max(0, Math.floor(daysSince(iso, now)));
  if (d === 0) return "updated today";
  if (d === 1) return "updated 1d ago";
  if (d < 30) return `updated ${d}d ago`;
  const w = Math.floor(d / 7);
  if (d < 60) return `updated ${w}w ago`;
  const m = Math.floor(d / 30);
  return `updated ${m}mo ago`;
}

export function resolveCard(
  agent: AgentConfig,
  repo: RepoData,
  rules: Rules,
  now: number,
): ResolvedCard {
  let status: Status;

  if (agent.status === "auto") {
    if (!repo.exists) status = "planned";
    else if (repo.hasReleaseTag && repo.pushedAt && daysSince(repo.pushedAt, now) <= rules.active_window_days)
      status = "active";
    else status = "building";
  } else {
    status = agent.status;
    // Promote building → active on first real release (P1).
    if (status === "building" && rules.promote_on_first_release && repo.hasReleaseTag) {
      status = "active";
    }
    // Never render "active" for a repo that isn't actually reachable.
    if (status === "active" && !repo.exists) status = "building";
    // A "planned" config entry stays planned even if a repo appears — author intent wins.
  }

  const linked = repo.exists && status !== "planned";

  return {
    status,
    updatedLabel: repo.pushedAt ? relativeTime(repo.pushedAt, now) : null,
    version: repo.latestReleaseTag,
    stars: repo.stars,
    forks: repo.forks,
    linked,
  };
}
