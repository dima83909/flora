@AGENTS.md

# Flora

Flower shop web store (Next.js 16 App Router, Prisma 7 + Postgres, Tailwind 4, shadcn/Radix, Vercel Blob for photos). Reply to the user in Ukrainian; keep this file and code comments in English.

## Production

- Deployed on Vercel from `main`: pushing to `main` deploys immediately.
- Run production DB commands only on explicit request, and only as `DOTENV_PATH=.env.prod npm run <db:deploy|db:seed|admin:create>`. `.env.prod` is git-ignored and nothing loads it automatically.
- Schema migration order: run `db:deploy` against production first, then push right away.
- Never run `db:check` against production (it creates and deletes test orders).
- Never print connection strings or tokens. Do not reintroduce `BLOB_READ_WRITE_TOKEN`: Blob uses OIDC.

## UI rules

- Build new UI on the existing shadcn/Radix components and Tailwind tokens instead of from scratch.
- Touch targets are at least 44px on touch screens. Grow the visible size only for touch with `any-pointer-coarse:` (the Button sizes already do), or keep a compact control and widen its hit area with a pseudo-element (`relative after:absolute after:-inset-1.5`). Mouse users keep the compact sizes. `src/components/touch-targets.test.ts` checks this.

## Design skills (optional, local machine only)

These skills are installed globally on the owner's machine (`~/.claude/skills/`), not in the repo; sessions without them follow the UI rules above.

- `ui-ux-pro-max` (via `uipro init --ai claude --global`): accessibility, UX rules, responsiveness, contrast. Its rules win on any conflict.
- `design-taste-frontend` (from `Leonxlnx/taste-skill`): aesthetics and visual character for new pages and components.
- `redesign-existing-projects` (from `Leonxlnx/taste-skill`): audit and polish of existing screens, without breaking functionality.

Use one design skill per task unless the user names several.
