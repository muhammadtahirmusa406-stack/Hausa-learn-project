# Hausa Learn

Hausa Learn is a gamified Hausa language-learning app with progressive lessons, persistent learner progress, retry practice, and culturally inspired UI.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required secret: `SESSION_SECRET` — session signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/api-server/src/lib/seed.ts` — editable seed content for units, lessons, exercises, vocabulary, achievements, and daily challenges
- `artifacts/api-server/src/routes/` — Express API routes
- `artifacts/api-server/src/lib/learning-state.ts` — lives, regeneration, and streak rules
- `artifacts/hausa-learn/src/pages/` — dashboard, learn path, lesson flow, vocabulary, progress, achievements, and leaderboard screens
- `artifacts/hausa-learn/src/lib/hausa-audio.ts` — Hausa-only browser audio guard
- `lib/db/src/schema/` — Drizzle/PostgreSQL schema
- `lib/api-spec/openapi.yaml` — API source of truth; generated clients live in `lib/api-client-react` and `lib/api-zod`

## Architecture decisions

- Learner data is preserved: startup seeding only fills an empty units table and never resets existing progress.
- A wrong answer removes one of five persistent lives and adds the exercise to a server-side retry queue; it is removed only after a correct answer.
- Retry questions return later in an alternate format when the content supports it; zero lives pauses the lesson and automatic regeneration restores one life every 30 minutes.
- Streaks are meaningful activity streaks: same-day activity does not inflate the count, activity more than 24 hours later resets it, and lesson/daily-challenge completions are qualifying activity.
- Browser audio is intentionally conservative: the app only uses a voice whose language is explicitly Hausa and never presents English as Hausa.

## Product

The app contains six progressive units, 22 lessons, mixed-format exercises, daily goals and challenges, XP, streaks, trophies, leaderboard rankings, vocabulary review, responsive layouts, authentication, and dark/light themes. Learner progress, lesson completions, lives, retry queues, and streak timestamps are stored in PostgreSQL.

## User preferences

- Keep Hausa Learn as the existing main product; do not rebuild or replace it.
- Keep content easy to edit through seed/content files and avoid destructive reseeding.

## Gotchas

- Edit `lib/api-spec/openapi.yaml` before changing API response shapes, then run `pnpm --filter @workspace/api-spec run codegen`.
- Run additive database changes against development before restarting the API. Production schema changes are applied through Replit Publish.
- Do not use an `en-NG` or other English voice as Hausa audio; if no Hausa-capable voice exists, show the unavailable state.
- Do not drop units or tables to refresh content in a shared environment; existing learner XP, progress, streaks, and completions must survive.

## Pointers

- `README.md` — setup, content editing, deployment, and contribution guide
- `CONTRIBUTING.md` — contribution workflow
- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
