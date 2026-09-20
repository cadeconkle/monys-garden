# Mony's Garden

A private book for the household Garden in Fuquay-Varina, North Carolina. One Gardener. Two surfaces: Catalog and Garden.

Domain language lives in `CONTEXT.md`. Decisions live in `docs/adr/`.

## Run

```bash
npm install
npm test
npm run dev
```

The local app uses an in-memory household so you can open the garden without Netlify Identity. Production uses `@netlify/identity` and Netlify Database so phone and iPad share the same Gardener.

## Deploy

The site is a Vite + React app on Netlify. After the first production deploy:

1. Enable Identity in Project configuration
2. Turn on autoconfirm so the first opening does not wait on email
3. Leave registration open — the app still refuses a second Gardener
