---
name: Replit Auth Web Lib Pattern
description: How to correctly configure replit-auth-web as a composite workspace lib for Vite consumption without React duplication errors.
---

## The Rule

`lib/replit-auth-web/package.json` exports must point to `"./src/index.ts"` (not `./dist/index.js`), matching the pattern used by `@workspace/api-client-react`.

**Why:** Vite consumes workspace libs by bundling their TypeScript source directly. Pointing exports to a pre-compiled `./dist/index.js` breaks resolution when the dist folder only has `emitDeclarationOnly` output (`.d.ts` files, no `.js`). The Vite `dedupe: ["react", "react-dom"]` in `hausa-learn/vite.config.ts` handles React deduplication when source is bundled by Vite.

**How to apply:**
- `tsconfig.json`: Use `composite: true`, `declarationMap: true`, `emitDeclarationOnly: true` for TypeScript project references.
- `package.json exports`: Use `"./src/index.ts"` so Vite bundles source directly.
- `import.meta.env` is not typed in composite lib context — use `(import.meta as Record<string, any>).env?.BASE_URL` pattern.
