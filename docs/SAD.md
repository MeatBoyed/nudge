# Nudge — Software Architecture Document

Implements [PRD.md](./PRD.md). Decisions here resolve the two open assumptions from the PRD as defaults: an Item links to **at most one Envelope** (no splitting), and an Envelope links to **at most one Project or one Goal, not both**.

## 1. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router), TypeScript | Single deployable for UI + API, server actions remove need for a separate backend. |
| Styling | Tailwind CSS + shadcn/ui | Fast to build a clean dashboard/calendar UI solo. |
| Database | PostgreSQL | Relational fit for the Item/Project/Goal/Envelope graph; native array type useful for ReminderSchedule offsets. |
| ORM | Prisma 7, via `@prisma/adapter-pg` driver adapter | Type-safe schema + migrations, low ceremony for a single-developer project. Prisma 7 has no Rust query-engine binary — the adapter talks to Postgres directly via `pg`, which also removes the old Alpine/openssl binary-mismatch failure mode entirely. |
| AI | Anthropic API, `claude-haiku-4-5` | Cheap/fast model, sufficient for a one-shot category suggestion from a name + link. |
| Auth | Custom single-passphrase + signed cookie | No multi-user requirement; a full auth library (NextAuth, etc.) is unneeded weight. |
| Deployment | Docker Compose (native + Dokploy variants) | Self-hosted on the user's own Dokploy instance, not Vercel. |

## 2. High-Level Architecture

```
Browser (desktop/phone)
   │  HTTPS
   ▼
Next.js app (single container)
   ├─ App Router pages (dashboard, inbox, calendar, project/goal/envelope detail)
   ├─ Server Actions / Route Handlers (mutations, queries)
   ├─ proxy.ts — passphrase-session gate on every request (Next 16 renamed
   │  "Middleware" to "Proxy"; it now defaults to the Node.js runtime, not
   │  Edge, so there's no Edge-compatibility constraint on what it can import)
   └─ lib/ai — outbound call to Anthropic API (category suggestion)
   │
   ▼
PostgreSQL (separate container)
```

One app container, one DB container. No queue, no cache layer, no separate worker process — traffic and data volume are single-household scale.

## 3. Authentication

- `POST /api/auth/login` — body `{ passphrase }`, compared directly against the plain-text `APP_PASSPHRASE` env var. On match, issues a signed, httpOnly, `SameSite=Lax` cookie (JWT via `jose`, signed with `SESSION_SECRET`), ~30-day expiry.
- `proxy.ts` — validates the cookie on every request except `/login` and `/api/auth/login`; redirects to `/login` if missing/invalid.
- No per-user records — "authenticated" is a single boolean fact, not tied to an identity.
- `APP_PASSPHRASE` is stored in plain text, not hashed. Deliberate simplicity tradeoff: set-and-restart with no generation step, at the cost of the passphrase being readable if `.env` ever leaks. An earlier version stored a base64-encoded bcrypt hash instead (avoiding that exposure, and incidentally side-stepping a real gotcha where Next.js's `.env` loader does shell-style `$VAR` interpolation and mangles a raw bcrypt hash's literal `$` characters) — reverted in favor of plain text per explicit user preference. If this ever needs revisiting, see git history for `src/lib/auth.ts`.

## 4. Data Model

### 4.1 Entity-Relationship Summary

- **Item** → optionally belongs to one **Project**, one **Envelope**, one **ReminderSchedule**, one **Category**; many-to-many with **Goal** via `ItemGoal`.
- **Envelope** → optionally belongs to one **Project** *or* one **Goal** (enforced via a DB check constraint, not both).
- **Project** ↔ **Goal** → optional many-to-many via `ProjectGoal` (a project can serve goals; not required).
- **Category** and **ReminderSchedule** are flat, reusable lookup tables.
- **EnvelopeTopUp** is the append-only history of funds added to an Envelope — allocated/spent/available are computed, never stored.

### 4.2 Prisma Schema Sketch

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}

enum ItemStage {
  CAPTURED
  CLEANED
  COMPLETED
  CANCELLED
}

enum ProjectStatus {
  ACTIVE
  COMPLETED
  CANCELLED
}

enum GoalStatus {
  ACTIVE
  ARCHIVED
}

model Category {
  id        String   @id @default(cuid())
  name      String   @unique
  color     String?
  createdAt DateTime @default(now())
  items     Item[]
}

model Project {
  id          String        @id @default(cuid())
  name        String
  description String?
  targetDate  DateTime?
  status      ProjectStatus @default(ACTIVE)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  items       Item[]
  envelopes   Envelope[]
  goals       ProjectGoal[]
}

model Goal {
  id          String        @id @default(cuid())
  name        String
  description String?
  status      GoalStatus    @default(ACTIVE)
  createdAt   DateTime      @default(now())
  items       ItemGoal[]
  envelopes   Envelope[]
  projects    ProjectGoal[]
}

model ProjectGoal {
  projectId String
  goalId    String
  project   Project @relation(fields: [projectId], references: [id])
  goal      Goal    @relation(fields: [goalId], references: [id])
  @@id([projectId, goalId])
}

model ItemGoal {
  itemId String
  goalId String
  item   Item @relation(fields: [itemId], references: [id])
  goal   Goal @relation(fields: [goalId], references: [id])
  @@id([itemId, goalId])
}

model Envelope {
  id        String          @id @default(cuid())
  name      String
  projectId String?
  goalId    String?
  project   Project?        @relation(fields: [projectId], references: [id])
  goal      Goal?           @relation(fields: [goalId], references: [id])
  createdAt DateTime        @default(now())
  topUps    EnvelopeTopUp[]
  items     Item[]
  // CHECK (project_id IS NULL OR goal_id IS NULL) — added via raw SQL migration
}

model EnvelopeTopUp {
  id         String   @id @default(cuid())
  envelopeId String
  envelope   Envelope @relation(fields: [envelopeId], references: [id])
  amount     Decimal
  date       DateTime @default(now())
  note       String?
}

model ReminderSchedule {
  id      String @id @default(cuid())
  name    String @unique
  offsets Int[]
  items   Item[]
}

model Item {
  id                 String            @id @default(cuid())
  name               String
  link               String?
  stage              ItemStage         @default(CAPTURED)
  suggestedCategory  String?
  categoryId         String?
  category           Category?         @relation(fields: [categoryId], references: [id])
  projectId          String?
  project            Project?          @relation(fields: [projectId], references: [id])
  envelopeId         String?
  envelope           Envelope?         @relation(fields: [envelopeId], references: [id])
  reminderScheduleId String?
  reminderSchedule   ReminderSchedule? @relation(fields: [reminderScheduleId], references: [id])
  plannedPrice       Decimal?
  actualPrice        Decimal?
  targetDate         DateTime?
  goals              ItemGoal[]
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt
}
```

### 4.3 Derived Values (not persisted)

| Value | Computation |
|---|---|
| Envelope `allocated` | `SUM(EnvelopeTopUp.amount)` for the envelope |
| Envelope `spent` | `SUM(Item.actualPrice)` where `envelopeId` matches and `stage = COMPLETED` |
| Envelope `available` | `allocated − spent` |
| Item reminder dates | `targetDate − offset` for each value in its `ReminderSchedule.offsets` |
| Dashboard "Upcoming" | Items with `stage = CLEANED` whose nearest reminder date has passed but `targetDate` hasn't |
| Dashboard "Overdue" | Items with `stage = CLEANED` and `targetDate < today` |

Kept computed-at-query-time rather than materialized — dataset is single-household scale, so there's no performance case for denormalizing yet.

## 5. AI Auto-Tagging Integration

- `lib/ai/suggestCategory.ts` calls the Anthropic Messages API (`claude-haiku-4-5`) with the item's name (+ link if present), using a tool-call/JSON schema to force a structured `{ category: string }` response.
- Triggered on Capture (`POST /api/items`), but **not awaited** by the request handler — the Item row is inserted and the response returned immediately, then the suggestion call runs and updates `Item.suggestedCategory` afterward. This keeps capture latency to a single DB insert, matching the "near-zero friction" requirement.
- This fire-and-forget pattern is safe here because the app runs as a long-lived Node process in a Docker container (not a serverless function that terminates after the response) — no job queue needed for v1.
- On Clean, the UI shows `suggestedCategory` as a pre-filled, editable field; confirming either matches it to an existing `Category` (case-insensitive) or creates a new one.

## 6. Application Structure

```
nudge/
├── docs/
│   ├── PRD.md
│   └── SAD.md
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts                  # default Categories + a couple ReminderSchedules
│   └── migrations/
├── prisma.config.ts              # Prisma 7: datasource URL + seed command live here
├── generated/prisma/             # generated client output (gitignored, regenerated on build)
├── src/
│   ├── proxy.ts                  # passphrase-session gate (formerly middleware.ts)
│   ├── app/
│   │   ├── login/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx      # shared nav
│   │   │   ├── page.tsx        # Inbox count (stub; Upcoming/Overdue not yet implemented)
│   │   │   ├── inbox/page.tsx
│   │   │   ├── calendar/page.tsx  # placeholder
│   │   │   ├── projects/[id]/page.tsx
│   │   │   ├── goals/[id]/page.tsx
│   │   │   ├── envelopes/[id]/page.tsx
│   │   │   └── items/[id]/page.tsx
│   │   └── api/
│   │       ├── auth/login/route.ts
│   │       └── items/route.ts  # capture only; clean/complete/cancel not yet built
│   ├── components/ui/           # shadcn generated
│   └── lib/
│       ├── db.ts                 # Prisma client singleton (PrismaPg adapter)
│       ├── auth.ts               # session sign/verify + passphrase check
│       └── ai/suggestCategory.ts
├── Dockerfile
├── docker-compose.yml            # native Docker
├── docker-compose.dokploy.yml    # Dokploy
├── .dockerignore
├── .env.example
└── .env                          # local dev only, gitignored
```

The detail pages and dashboard above are intentionally **stubs that prove the DB/auth/Prisma wiring end-to-end** — they render real data (e.g. live Inbox count) but the Clean/Complete/Cancel flows, calendar rendering, and reminder/envelope-balance computations described in §4.3 and §7 are not yet implemented. That's the next slice of work, not part of this scaffold.

## 7. Key Server Operations

| Operation | Status | Notes |
|---|---|---|
| `POST /api/items` | **Implemented** | Capture — name (+ link) only; inserts `stage=CAPTURED`; fires async category suggestion. |
| `PATCH /api/items/:id/clean` | Planned | Clean — sets category/project/goals/envelope/price/targetDate/reminderSchedule; moves `stage → CLEANED`. |
| `PATCH /api/items/:id/complete` | Planned | Sets `actualPrice`; moves `stage → COMPLETED`. |
| `PATCH /api/items/:id/cancel` | Planned | Moves `stage → CANCELLED` from `CAPTURED` or `CLEANED`. |
| `POST /api/envelopes/:id/topups` | Planned | Records a top-up (amount, date, note). |
| Dashboard data | **Implemented**, as direct Server Component queries | Inbox count and per-item pages query Prisma directly in the page component rather than through a separate `GET /api/dashboard` — simpler for content only the app itself renders. Revisit only if a non-page consumer needs the same data. |

(Implemented as Next.js Route Handlers; may move to Server Actions where it simplifies form handling — no behavioral difference at this layer.)

## 8. Deployment

### 8.1 Dockerfile

Multi-stage build (`deps` → `builder` → `runner`), Next.js `output: 'standalone'` for a minimal runtime image.

### 8.2 `docker-compose.yml` (native Docker)

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    depends_on:
      - db
  db:
    image: postgres:16-alpine
    env_file: .env
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

### 8.3 `docker-compose.dokploy.yml`

Same two services; the only intended differences are that the app does **not** publish a host port (Dokploy's own proxy routes to the container network) and Dokploy-specific labels are added for domain/SSL routing. Exact label syntax to be confirmed against Dokploy's current docs at first deploy — noted here as the one piece not fully nailed down yet.

```yaml
services:
  app:
    build: .
    env_file: .env
    depends_on:
      - db
    # Dokploy routes via its own proxy; domain/SSL configured in the Dokploy UI
    # or via labels here once confirmed against Dokploy's docs.
  db:
    image: postgres:16-alpine
    env_file: .env
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

### 8.4 Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string. `localhost` for host-side `npm run dev`; the `app` service in both Compose files overrides this to use the `db` service name via `environment:`, since the value in `.env` can't serve both contexts at once. |
| `APP_PASSPHRASE` | The shared passphrase, plain text (see §3) |
| `SESSION_SECRET` | Signing key for the session cookie |
| `ANTHROPIC_API_KEY` | Used by the category-suggestion call |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Read by the `postgres` image itself; also substituted into the `app` service's `DATABASE_URL` override above |

## 9. Migrations & Seeding

- `prisma migrate deploy` runs on container start, as the Docker image's `CMD` (`node_modules/.bin/prisma migrate deploy && node server.js`), so the DB schema is always current with the deployed image. The runner stage ships the **full** `node_modules` (not just the Next.js standalone trace) specifically so the Prisma CLI and its dependency closure are available for this — see the Dockerfile comment.
- `prisma/seed.ts` seeds a handful of starter Categories and 2–3 ReminderSchedules (e.g. "Quick" = `[3,1]`, "Standard" = `[30,14,7,5,3]`) so the app isn't empty on first run. Run manually via `npx prisma db seed`; not wired into the container boot sequence (seeding is idempotent via `upsert`, but re-running it automatically on every restart isn't necessary).

## 10. Open Architecture Risks

1. **Dokploy compose labels** (§8.3) — placeholder until first deploy confirms exact routing config against Dokploy's current version.
2. **Fire-and-forget AI call** (§5) — acceptable for v1 single-user load; if it ever needs retries/observability, this is the first place a small job table would get introduced.
3. **OG-tag link enrichment** (PRD stretch goal) — no architecture committed yet; would add a server-side fetch+parse step on link entry, cached on the Item row, if pursued.
4. **Docker build unverified end-to-end in dev.** `npm run dev` and `npm run build` are fully verified (auth flow, item capture, AI fire-and-forget, Prisma migrations/seed all tested live against a real Postgres container). The actual `docker build`/`docker compose up --build` could not be completed in the sandbox this was scaffolded in — `npm ci` inside any container there reliably hit `ECONNRESET` under connection concurrency (diagnosed: DNS resolution and single large sustained downloads both worked fine; only `npm ci`'s many-concurrent-connection fetch pattern failed, consistently, across 6+ attempts with different mitigations). This looks like a sandbox-specific Docker networking limitation, not a defect in the Dockerfile, but **the actual containerized boot sequence (image build, `prisma migrate deploy` on start, app serving traffic from inside a container) has not been observed working.** Verify this on a real Docker host (e.g. the target Dokploy server) before relying on it.
5. **Next.js 16 static-prerendering trap.** Pages that read live DB state with no dynamic route param (e.g. the dashboard root and Inbox) get silently statically prerendered at build time by default — their data would be frozen at the build's moment forever, never refreshed per request. Fixed here via `await connection()` from `next/server` before the query (see `src/app/(dashboard)/page.tsx` and `inbox/page.tsx`). Apply the same pattern to any future page that reads live data without a dynamic param; pages with a `[id]` segment were observed to opt into dynamic rendering automatically and don't need it.
