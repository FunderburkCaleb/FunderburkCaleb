# agent-console-readme — developer notes

The engine behind the **Agent Orchestrator Console** profile. `README.md` is a
generated artifact — never hand-edit it.

## Run it

```bash
npm install
npm run build        # cards + telemetry + README.md
# or piecemeal:
npm run build:cards      # agent cards → assets/generated/*.svg + cards.json
npm run build:telemetry  # telemetry strip → assets/generated/telemetry-*.svg
npm run assemble         # templates/README.tpl.md + assets → README.md
npm run typecheck
```

**Local vs. CI.** Without `GITHUB_TOKEN` the build runs from config only — no live
stars/dates, and `status: auto` repos degrade to `planned`. Set a token to see live
data locally:

```bash
GITHUB_TOKEN=$(gh auth token) npm run build
```

In GitHub Actions the workflow-provided `GITHUB_TOKEN` is enough (public data only).

## The one edit point

`config/agents.yml` is the single source of truth for the registry — add, reorder,
or restatus a flagship there and rerun `npm run build`. Schema and derivation rules
live in `github-profile-spec.md` §4.1.

- `status: auto` → has a release tag **and** pushed within `active_window_days` → `active`;
  exists but no release → `building`; 404 → `planned` (warns, never fails the build).
- Exactly one agent may be `featured: true` (the 2-col anchor card).
- `domain` picks the accent rail tint (see `scripts/lib/tokens.ts`).

## Layout

```
config/agents.yml         single source of truth
scripts/
  lib/tokens.ts           palette + domain accents + type roles (the design system)
  lib/config.ts           load + validate agents.yml
  lib/github.ts           GraphQL repo data (graceful degrade: no token / 404)
  lib/status.ts           status + "updated Nd ago" derivation
  lib/svg.ts              escape / wrap / minify helpers
  lib/card.ts             the agent-card SVG (signature element)
  build-cards.ts          orchestrates cards + writes cards.json manifest
  build-telemetry.ts      telemetry strip (P1)
  assemble-readme.ts      template tokens → README.md
templates/README.tpl.md   source template ({{HERO}} {{AGENT_REGISTRY}} {{TELEMETRY}})
assets/
  hero-{dark,light}.svg   hand-built, Day 3 (assemble emits a placeholder until present)
  generated/              build output — cards, telemetry, manifest
.github/workflows/refresh.yml   daily 06:00 ET + on-push, diff-gated commits
```

## Still to build (per spec)

- **Hero SVG** (`assets/hero-{dark,light}.svg`) — Day 3 hand-built animated console boot.
  `assemble-readme.ts` drops in a placeholder comment until both files exist.
- **Compliance gate** — run the `compliance-reviewer` skill on the final README before
  the repo goes public (spec §7 / §3.1: the hero carries "@ Microsoft", so disclaimer
  placement is P0). The footer disclaimer is already in the template.
