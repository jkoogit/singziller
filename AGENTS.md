# AGENTS.md

## Git Workflow

- At session start, fetch `origin` and compare `origin/dev`, `origin/stg`, and `origin/main`.
- Start every Codex work branch from the current `origin/main`.
- Use `task/` as the Codex work branch prefix. Do not use `codex/`.
- If existing `codex/*` branches are found, rename them to matching `task/*` branches at the same commit.

## Delivery Workflow

- Proceed with agent coding for implementation work.
- Create a PR for each work unit after tests are verified.
- After PR verification passes, promote to `stg`, then to `main`.
- When each feature phase is completed, update a progress report under `docs/08-project-management/`.
