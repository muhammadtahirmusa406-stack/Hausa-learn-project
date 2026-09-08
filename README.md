# Hausa Learn 🇳🇬

> A full-stack, gamified Hausa language learning application built with React, TypeScript, Node.js, and PostgreSQL — inspired by Duolingo but rooted in Hausa culture.

---

## Overview

**Hausa Learn** helps speakers of any language learn Hausa — the native tongue of over 70 million people across Northern Nigeria, Niger, Ghana, and the broader West African diaspora. The app takes a progressive, game-like approach: unlock units, complete lessons, earn XP, maintain streaks, and compete on the leaderboard.

### Features

- **6 Full Units** — Basics → Greetings → Numbers & Time → Colors & Objects → Food & Drinks → Family & Home
- **22 Lessons** with 15+ exercises each (330+ total exercises)
- **Mixed exercise formats** — Multiple choice, translation, fill-in-the-blank, typing, listening, and word ordering
- **Persistent practice safety net** — Five lives per lesson attempt, server-side retry queues, alternate retry formats, and timed life restoration
- **Audio playback** — Uses only an explicitly Hausa-capable browser voice; otherwise the app clearly reports that audio is unavailable
- **Unit locking with checkpoints** — Complete units to unlock the next, or skip ahead via a checkpoint
- **XP & Streaks** — Earn XP per lesson, maintain daily streaks, level up
- **Leaderboard** — Compete with other learners
- **Daily Challenge** — A new Hausa question every day
- **Daily Goals** — Track words, lessons, and XP goals
- **Achievements** — Unlock trophies for milestones
- **Dark/Light mode** — Toggle with preference saved to localStorage
- **Authentication** — Replit OIDC login; guest sessions also track progress
- **Mobile-friendly** — Responsive design for all screen sizes

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v4 + shadcn/ui components |
| State/Data | TanStack React Query + Orval-generated hooks |
| Backend | Node.js + Express 5 + TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod v4 + drizzle-zod |
| API Contract | OpenAPI 3.1 (code-first, generated) |
| Auth | Replit OIDC (via express-session + openid-client) |
| Build | esbuild (server) + Vite (frontend) |
| Package Manager | pnpm workspaces (monorepo) |

---

## Project Structure

```
hausa-learn/
├── artifacts/
│   ├── api-server/          # Express API server
│   │   └── src/
│   │       ├── routes/      # API route handlers
│   │       └── lib/
│   │           └── seed.ts  # Lesson & exercise content
│   └── hausa-learn/         # React frontend
│       └── src/
│           ├── pages/       # Route-level page components
│           └── components/  # Shared UI components
├── lib/
│   ├── api-spec/            # OpenAPI spec (source of truth)
│   │   └── openapi.yaml
│   ├── api-client-react/    # Generated React Query hooks
│   ├── api-zod/             # Generated Zod validation schemas
│   ├── db/                  # Drizzle ORM schema + client
│   └── replit-auth-web/     # Replit auth React hook
└── python-flask-guide/      # Beginner Flask learning project
```

---

## Getting Started (Local / Replit)

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL database

### Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Express session secret (random string) |

> **Never commit these to version control.** On Replit, use the Secrets panel. Locally, use a `.env` file (add `.env` to `.gitignore`).

### Installation

```bash
# Install all dependencies
pnpm install

# Push database schema
pnpm --filter @workspace/db run push

# Start the API server
pnpm --filter @workspace/api-server run dev

# Start the frontend (in a second terminal)
pnpm --filter @workspace/hausa-learn run dev
```

The app will be available at `http://localhost:5173` (frontend) and `http://localhost:5000/api` (backend).

### Regenerate API client after spec changes

```bash
# Edit lib/api-spec/openapi.yaml first, then:
pnpm --filter @workspace/api-spec run codegen
```

---

## Database

The database auto-seeds on first startup with:

- 6 units with progressive locking
- 22 lessons across all units
 - 330+ exercises across multiple choice, translation, fill-in-the-blank, typing, listening, and word ordering formats
- Persistent learner lives and missed-question retry queues
- 35 vocabulary words with pronunciations and example sentences
- 15 achievements
- 15 daily challenges

The seed runs only when the `units` table is empty. Do not drop tables in a shared environment: existing XP, progress, streaks, completions, lives, and retry queues must be preserved.

---

## Deployment

### Replit (recommended)

1. Fork this project on [Replit](https://replit.com)
2. Add `DATABASE_URL` and `SESSION_SECRET` in the Secrets panel
3. Click **Publish** to deploy

### Heroku

```bash
heroku create hausa-learn
heroku addons:create heroku-postgresql:mini
heroku config:set SESSION_SECRET=$(openssl rand -hex 32)
git push heroku main
```

Set `DATABASE_URL` automatically from the Heroku Postgres add-on.

### Vercel / Railway

The API server builds to a single ESM bundle (`dist/index.mjs`). Point Railway/Render at `node dist/index.mjs` and set `DATABASE_URL` + `SESSION_SECRET` as environment variables. The frontend can be deployed separately as a static site after `pnpm --filter @workspace/hausa-learn run build`.

---

## Adding New Content

Lesson content currently lives in `artifacts/api-server/src/lib/seed.ts` and is designed to move cleanly into JSON/content files as the course expands. To add a new lesson:

1. Add an entry to the `LESSONS` array with the right `unitIndex`
2. Add exercises to the `EXERCISES` array referencing the new `lessonIndex`
3. Run the API against an empty development database, or add a separate content migration; never delete learner data to refresh content

---

## Contributing

Pull requests are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes following the existing code style
4. Run `pnpm run typecheck` to verify TypeScript
5. Submit a pull request describing what you changed and why

### Code Style

- TypeScript strict mode throughout
- No `console.log` in server code — use the `logger` singleton (`req.log` in routes)
- Use Zod for all request/response validation
- API changes must start in `lib/api-spec/openapi.yaml`, then run codegen

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Acknowledgements

- Hausa language data based on standard Northern Nigerian dialect
- Inspired by the Hausa-speaking communities of Kano, Sokoto, and Kaduna
- Built with ❤️ for learners worldwide

---

## Screenshots

> Coming soon — the app is live on Replit!
