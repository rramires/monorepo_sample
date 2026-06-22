# AGENTS.md

Pointer for AI coding tools at the **monorepo root**. Keep it thin — the real
content lives in the files it points to.

> **Monorepo:** `api/` (backend) + `web/` (frontend) + `packages/contracts/`
> (`@root/contracts`, shared Zod schemas) in one pnpm workspace. The git root is
> **here**.

- **Working rules / doctrine:** read [CLAUDE.md](./CLAUDE.md) — it governs the
  workspace, the shared contract, branching, commits, merges, and push. When
  working inside an app, also read that app's `CLAUDE.md`
  ([api](./api/CLAUDE.md) / [web](./web/CLAUDE.md)).
- **Architecture:** [PROJECT.md](./PROJECT.md). Contract rules:
  [packages/contracts/README.md](./packages/contracts/README.md).
- **Install once at the root** (`pnpm install`); run scripts per app
  (`pnpm -C <app> <script>`).
- **Never `git push`** — that is the maintainer's. Confirm before anything
  irreversible.

<!-- checkpoint:state -->
- **Resume state:** read [HANDOFF.md](./HANDOFF.md) for where the last session
  left off (branch, commit, in-flight work, next step).
<!-- /checkpoint:state -->

