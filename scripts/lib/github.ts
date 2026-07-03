/**
 * Live repo data via GitHub GraphQL.
 *
 * Auth: uses GITHUB_TOKEN (the Actions-provided token is enough for public data).
 * Local dev with no token → returns null for every repo so the build still runs
 * against config-only data (statuses come from overrides, stats are suppressed).
 */

import { graphql } from "@octokit/graphql";

export interface RepoData {
  exists: boolean;
  stars: number;
  forks: number;
  pushedAt: string | null; // ISO
  latestReleaseTag: string | null;
  hasReleaseTag: boolean;
}

const MISSING: RepoData = {
  exists: false,
  stars: 0,
  forks: 0,
  pushedAt: null,
  latestReleaseTag: null,
  hasReleaseTag: false,
};

const QUERY = /* GraphQL */ `
  query ($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      stargazerCount
      forkCount
      pushedAt
      releases(first: 1, orderBy: { field: CREATED_AT, direction: DESC }) {
        totalCount
        nodes { tagName }
      }
      refs(refPrefix: "refs/tags/", first: 1) {
        totalCount
      }
    }
  }
`;

interface RepoResponse {
  repository: {
    stargazerCount: number;
    forkCount: number;
    pushedAt: string;
    releases: { totalCount: number; nodes: { tagName: string }[] };
    refs: { totalCount: number };
  } | null;
}

export function hasToken(): boolean {
  return Boolean(process.env.GITHUB_TOKEN);
}

export async function fetchRepo(owner: string, name: string): Promise<RepoData> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return MISSING;

  const client = graphql.defaults({ headers: { authorization: `token ${token}` } });

  try {
    const res = await client<RepoResponse>(QUERY, { owner, name });
    const r = res.repository;
    if (!r) return MISSING; // 404 → degrade to planned upstream
    const release = r.releases.nodes[0];
    return {
      exists: true,
      stars: r.stargazerCount,
      forks: r.forkCount,
      pushedAt: r.pushedAt,
      latestReleaseTag: release?.tagName ?? null,
      hasReleaseTag: r.refs.totalCount > 0 || r.releases.totalCount > 0,
    };
  } catch (err: unknown) {
    // A single missing/private repo must never fail the whole build (§4.1).
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`  ⚠ ${owner}/${name}: ${msg} — degrading to planned`);
    return MISSING;
  }
}
