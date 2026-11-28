<!-- PR title uses the commit format: feat(web): add bathroom baseline upload (GIT_FLOW.md §3) -->

## What

<!-- What changed, in a few bullets -->

## Why

<!-- The reason, and the linked PRD IDs, e.g. WA-9 -->

PRD:

## How to test

<!-- Steps a reviewer can follow -->

## Checklist (CONVENTIONS.md §9)

- [ ] Formatter + linter pass (`ruff`, `prettier`/`eslint`, `clang-format`)
- [ ] It runs locally, and tests pass if the folder has them
- [ ] No secrets, data files or model weights in the diff
- [ ] Docs updated if behavior changed
- [ ] Touches `web/prisma/`? Then พัลลภ + พลกฤต both review it (GIT_FLOW.md §4)
