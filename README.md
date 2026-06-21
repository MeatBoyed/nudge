# Nudge

A personal household planning app — shopping list, budget tracking, and reminders for a "smart but forgetful" single user. See [`docs/PRD.md`](./docs/PRD.md) for product scope and [`docs/SAD.md`](./docs/SAD.md) for architecture.

## Local Development

```bash
npm install
docker compose up -d db   # Postgres only
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Full Stack via Docker

```bash
docker compose up --build
```
