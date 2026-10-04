@AGENTS.md

# Flora

Flower shop web store (Next.js 16 App Router, Prisma 7 + Postgres, Tailwind 4, shadcn/Radix, Vercel Blob for photos). Reply to the user in Ukrainian; keep this file and code comments in English.

## Commands

- `npm run dev` / `build` / `lint` / `test` (vitest)
- Database: `db:migrate` (dev), `db:deploy`, `db:seed`, `db:studio`; `db:check` runs the integration check scripts
- `admin:create`, `maintenance:cleanup`, `orders:purge`

## Production

- Deployed on Vercel from `main`: pushing to `main` deploys immediately.
- Run production DB commands only on explicit request, and only as `DOTENV_PATH=.env.prod npm run <db:deploy|db:seed|admin:create>`. `.env.prod` is git-ignored and nothing loads it automatically.
- Schema migration order: run `db:deploy` against production first, then push right away.
- Never run `db:check` against production (it creates and deletes test orders).
- Never print connection strings or tokens. Do not reintroduce `BLOB_READ_WRITE_TOKEN`: Blob uses OIDC.

## Design skills

`ui-ux-pro-max` is installed globally (`~/.claude/skills/`, via `uipro init --ai claude --global`). Use it as the baseline for UI changes: accessibility, 44px touch targets, responsiveness, contrast. Build new UI on the existing shadcn/Radix components and Tailwind tokens instead of from scratch.

Also installed globally from `Leonxlnx/taste-skill`: `design-taste-frontend` and `redesign-existing-projects`. Their guidance can overlap with `ui-ux-pro-max`, so split the roles:

- `ui-ux-pro-max`: accessibility, UX rules, responsiveness, contrast. Its rules win on any conflict.
- `design-taste-frontend`: aesthetics and visual character for new pages and components.
- `redesign-existing-projects`: audit and polish of existing screens, without breaking functionality.

Use one design skill per task unless the user names several.
