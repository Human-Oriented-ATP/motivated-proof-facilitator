# Motivated Proof Monorepo

npm-workspaces monorepo.

## Packages

- `packages/motivated-proof-facilitator-old/` — the prior single-app codebase, preserved intact.
- `packages/motivated-proof-assistant/` — new project (fresh Vite + React + TS scaffold).

## Common commands

Install everything from the root:

```sh
npm install
```

Run a workspace:

```sh
npm run dev:old
npm run dev:assistant
```

Or directly:

```sh
npm run dev --workspace=motivated-proof-assistant
```
