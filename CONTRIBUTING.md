# Contributing to Hausa Learn

Thank you for your interest in contributing! Here's how to get involved.

## Ways to Contribute

### Add More Lessons & Exercises
The most impactful contribution is expanding the content library. All lesson data lives in `artifacts/api-server/src/lib/seed.ts`. You can:
- Add exercises to existing lessons (target 20+ per lesson)
- Add new lessons to existing units
- Create entirely new units (e.g., Travel, Healthcare, Business)

**Please verify all Hausa text with a native speaker before submitting.**

### Improve the Frontend
The frontend is built with React + TypeScript. Good areas to improve:
- Spaced repetition review mode
- Offline support (PWA)
- Better mobile gestures

### Fix Bugs
Check the Issues tab for open bugs. Look for issues labeled `good first issue`.

### Improve Audio
Currently we use Web Speech API with `en-NG` locale. Contributions of actual Hausa audio recordings would be very welcome.

## Development Setup

```bash
# Clone the repo
git clone https://github.com/your-username/hausa-learn
cd hausa-learn

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and SESSION_SECRET

# Push schema
pnpm --filter @workspace/db run push

# Start dev servers
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/hausa-learn run dev
```

## Code Standards

### TypeScript
- Strict mode is enabled — no `any` types
- All API request/response types are generated from `lib/api-spec/openapi.yaml`
- Never edit generated files in `lib/api-client-react/src/generated/` directly

### Server
- All server logging must use `req.log` (in route handlers) or the `logger` singleton
- Never use `console.log` in server code
- All inputs must be validated with Zod schemas

### API Changes
1. Edit `lib/api-spec/openapi.yaml` first
2. Run `pnpm --filter @workspace/api-spec run codegen`
3. Update route handlers in `artifacts/api-server/src/routes/`
4. Update frontend components to use new hooks

### Database Changes
1. Edit `lib/db/src/schema/` files
2. Run `pnpm --filter @workspace/db run push` to apply
3. Update any affected seed data in `artifacts/api-server/src/lib/seed.ts`

## Pull Request Process

1. Fork the repository and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Run `pnpm run typecheck` — all TypeScript must pass
4. Update the README if you've added features
5. Open a pull request with a clear description

## Hausa Language Guidelines

- Prioritize the Kano/Northern Nigerian dialect (most widely understood)
- Include pronunciation guides (using the phonetic notation already in the codebase)
- Provide example sentences showing words in context
- Mark tones where relevant (high ´, low `, falling ^)
- Have at least one native speaker review all new vocabulary

## Questions?

Open a GitHub Issue or start a Discussion. We're a welcoming community!
