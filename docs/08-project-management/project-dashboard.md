# Project Dashboard

Last updated: 2026-06-12

## Current Snapshot

| Area | Status | Evidence | Next Action |
| --- | --- | --- | --- |
| Branch workflow | Done | PR #6, #7, branch policy docs | Keep using `task/*` branches from `origin/main`. |
| Server and DB foundation | Done | PR #4, `server/`, migrations, DB docs | Add PostgreSQL repository integration when collection writes need persistence. |
| Collection source policy | Done | PR #8, #9, policy design and implementation plan | Use policy decisions as guardrails for real source adapters. |
| Collection policy foundation | Done | PR #10, `origin/stg` `4401a99`, `origin/main` `526cfab` | Start the next implementation slice. |
| PWA catalog download | Not started | Listed in next-work docs and Phase 2 roadmap | Implement manifest fetch state and IndexedDB stores. |
| Catalog generation and search API | Not started | Phase 4 roadmap | Build after download/storage path is clear. |
| Live official source adapters | Blocked by research | KY/TJ probe and legal/robots review still pending | Run source probe tasks before production collection. |

## Branch State

| Branch | Remote Head | Role | Note |
| --- | --- | --- | --- |
| `origin/main` | `526cfab` | Production baseline | Includes collection policy foundation from PR #10. |
| `origin/stg` | `4401a99` | Staging baseline | Includes PR #10 staging promotion. |
| `origin/dev` | `d2d92ff` | Older development integration branch | Not aligned with latest `stg`/`main`; current AGENTS.md workflow starts work from `origin/main`. |

## Phase Overview

| Phase | Status | Completed | Remaining |
| --- | --- | --- | --- |
| Phase 1: Docs and server foundation | Mostly done | Node.js/TypeScript/Fastify server, manifest mock API, PostgreSQL migrations, DB environment docs | PostgreSQL integration test/runbook hardening for stg/prd. |
| Phase 2: IndexedDB catalog download | Not started | Manifest mock exists on server | PWA manifest fetch helper, connection status, IndexedDB schema, snapshot storage UI. |
| Phase 3: Collection module foundation | Partially done | Provider contract, mock provider, registry, raw hash, in-memory dedup, run logging, source probe, schedule policy, validation scoring | PostgreSQL-backed repository, normalization pipeline, adapter runtime decisions. |
| Phase 4: Catalog generation and search API | Not started | Catalog schema and API draft docs exist | Candidate/master generation, `/search`, snapshot/delta publisher. |
| Phase 5: Official/external source connection | Blocked | Policy and trust model documented | TJ/KY request probes, robots/legal review, YouTube quota decision, personal API trust rules. |

## Completed Work Log

| Date | Work | Result | Verification |
| --- | --- | --- | --- |
| 2026-06-10 | Initial PWA and operating docs | Project skeleton and docs established | Review docs under `docs/reviews/`. |
| 2026-06-11 | Server DB foundation | Server skeleton, env config, migrations, provider seed, manifest mock API | `node tests\sheets.test.js`, `cd server && npm test`, `cd server && npm run build`. |
| 2026-06-11 | Branch policy alignment | Renamed `codex/*` to `task/*`, documented workflow | Git branch checks and review document. |
| 2026-06-11 | Collection source policy | Source trust tiers, roles, collection phases, validation process | Policy spec and plan under `docs/superpowers/`. |
| 2026-06-12 | Collection policy foundation | Testable TypeScript collection policy modules and tests | `node tests\sheets.test.js`, `cd server && npm test` (18 pass), `cd server && npm run build`. |

## Next Work Queue

| Priority | Work Item | Why It Matters | Suggested Scope |
| --- | --- | --- | --- |
| P0 | Refresh next-work checklist | The checklist still lists some completed collection foundation items as immediate work | Move completed PR #10 items to Done and make the next slice explicit. |
| P1 | PWA manifest connection | Connects existing server `/catalog/manifest` to the app and shows server readiness | Fetch helper, loading/error state, download-ready copy. |
| P1 | IndexedDB catalog stores | Required for offline catalog download and search | Add stores for `catalog_meta`, `catalog_songs`, `catalog_brand_entries`, `catalog_links`. |
| P2 | PostgreSQL collection repository | Moves collection foundation from in-memory tests toward durable source records | Implement repository interface backed by existing migrations. |
| P2 | Source probe task | Needed before live TJ/KY adapters | Record robots, status, parser fit, and pause reasons without bulk scraping. |
| P3 | Search API and catalog publisher | Required for full catalog flow | Build `/search`, snapshot, and delta publisher after storage decisions. |

## Decisions Needed

| Decision | Needed Before | Current Leaning |
| --- | --- | --- |
| IndexedDB implementation style | Phase 2 build | Use browser-native IndexedDB first unless complexity forces a wrapper. |
| Catalog payload format | Snapshot/delta publisher | Start with JSON snapshot and JSON delta; revisit NDJSON when size/streaming require it. |
| Collector runtime and deployment | PostgreSQL-backed collection runs | Keep Node.js/TypeScript server-side collectors. |
| TJ/KY live access boundaries | Any production source adapter | Probe and compliance review first; no production scraping until allowed. |
| `origin/dev` role | Future branch operations | Either realign with current workflow or retire as legacy integration branch. |

## Open Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Official TJ/KY access may be unstable or restricted | Live collection may be delayed | Keep adapters stubbed until probes and compliance checks pass. |
| `origin/dev` is behind `stg` and `main` | Confusion in older docs that still mention dev-target PRs | Treat AGENTS.md as current authority and update older docs incrementally. |
| Documentation filenames/content have encoding artifacts in some files | Harder navigation and status review | Prefer new ASCII filenames for operational docs; clean older docs as a separate task. |
| In-memory collection repository is not durable | Collection foundation cannot yet run as a real ingestion job | Add PostgreSQL repository in a focused slice. |

## Operating Rule

Use this dashboard as the first project-management document to check at session start. Update it whenever a PR is promoted to `stg` or `main`, or when a major work item changes status.
