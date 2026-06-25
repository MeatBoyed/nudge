# Nudge — Product Requirements Document

## 1. Summary

Nudge is a personal household planning app for a single "smart but forgetful" user. It tracks things that need to be bought or arranged — optionally grouped into time-bound **Projects** and/or linked to open-ended life **Goals** — with prices, budgets ("Envelopes"), target dates, and reminders, so nothing falls through the cracks. It follows a **Capture → Clean → Complete** workflow: jotting something down is friction-free and is itself a win; deciding what an item needs (category, budget, timeline) is a deliberate, separate step you do on your own schedule.

v1 is shopping-list + envelope budgeting + calendar + reminders. Finding the *best* version of an item (price comparison across retailers) is explicitly deferred to v2.

## 2. Problem

The user juggles recurring and one-off household purchases/tasks (groceries, moving prep, gifts, clothes, home projects) across different timelines and budgets, with no single place that tells them "here's what's coming up, what it serves, and what it'll cost." Generic to-do apps don't carry price/budget context; spreadsheets don't nudge. And forcing every captured thought to be fully detailed immediately creates enough friction that capture itself gets skipped.

## 3. Objectives (v1)

- One place to capture "things to buy/arrange" with near-zero friction — capturing is a win on its own, independent of ever cleaning or completing it.
- A clear, separate step to "clean" a captured item: decide its category, what Project/Goal(s) it serves, what Envelope funds it, its target date, and its reminders.
- Group items into time-bound Projects, and/or link them to open-ended life Goals they serve (a purchase can serve more than one Goal).
- Budget via reusable, toppable **Envelopes** rather than a single spending cap — see §11.
- Get reminded at multiple lead times before a target date, without setting each reminder by hand.
- See spend (planned vs. actual, per Envelope/Project/Goal and overall) at a glance.
- Visualize what's due when, on a calendar.
- Keep a permanent, browsable record of what's actually been completed — a reward log, not an archive you have to dig for.

## 4. Non-Objectives (v1)

- No multi-user/roles — single household, no accounts.
- No price comparison / "find the best deal" across retailers (v2).
- No push/email notifications — in-app only.
- No native mobile app — responsive web only.
- No automatic recurring items (e.g. "buy milk every week") — every item is added explicitly.

## 5. Target User

One person (the household's planner) using it from both desktop and phone browser. Optimized for instant capture (a thought to a saved record in seconds) and a glanceable dashboard — not for power-user data entry.

## 6. Core Concepts

| Entity | Purpose |
|---|---|
| **Item** | A thing to buy/arrange. Has a name, lifecycle stage (§9), category, optional Project, zero or more Goals, optional Envelope, planned price, actual price (once completed), optional target date, optional link, and optional reminder schedule. |
| **Category** | Classification for an item (e.g. "Furniture," "Clothing"). Suggested automatically by Claude Haiku, user-editable. |
| **Project** | A concrete, time-bound initiative with its own timeline (e.g. "Move to Joburg"). An item links to at most one Project. |
| **Goal** | An open-ended personal aspiration with no fixed end (e.g. "Have a wardrobe I love"). Items can link to one or many Goals. Goals aren't "finished" — they're an ongoing lens for spend and progress over time. |
| **Envelope** | A budget bucket with an allocated amount that can be topped up over time, tracking running spend and history against that allocation. See §11. |
| **ReminderSchedule** | A named, reusable list of day-offsets before a target date (e.g. "Standard prep" = [30, 14, 7, 5, 3]). Assigned to an item to generate its reminders. |

## 7. The Capture → Clean → Complete Workflow

Nudge mirrors a personal Capture/Clean/Complete practice instead of forcing every item to be fully specified the moment it's thought of.

- **Capture** — the only thing that matters is getting the thought out of your head. Type a name (and, optionally, paste a link) and it's saved instantly with stage `Captured`. A category suggestion from Haiku still runs in the background so it's ready later, but nothing is required of you yet. Capturing is itself the win — there's no penalty for leaving an item in this state indefinitely.
- **Clean** — a deliberate, separate pass, done from an **Inbox** view of all `Captured` items, where you decide what an item actually needs: confirm/edit its category, optionally attach it to a Project and/or one or more Goals, optionally assign it to an Envelope, and set a planned price, target date, and reminder schedule. Once decided, the item moves to `Cleaned` and becomes "live" — eligible to appear on the calendar, in Upcoming/Overdue, and against budget envelopes.
- **Complete** — when you actually buy/arrange the item, you record the actual price and flip it to `Completed`. It never disappears — it stays visible in history against whichever Project/Goal/Envelope it served, as a record of what you've actually accomplished.
- **Cancelled** is the escape hatch from `Captured` or `Cleaned` for things you decide you don't need after all. Like completed items, cancelled ones are kept, not deleted — just excluded from budgets and reminders.

The dashboard surfaces all three stages distinctly:
- **Inbox** — count and list of `Captured` items waiting to be cleaned (the "you have N things to process" nudge).
- **Upcoming / Overdue** — `Cleaned` items approaching or past their target date.
- **History** — `Completed` items, browsable by Project, Goal, or Envelope — the reward log.

## 8. Key Flows

### 8.1 Capture an item
1. User enters a name (and, optionally, a link). Saved instantly as `Captured` — no other field is required.
2. In the background, Haiku is called with the name (+ link if present) and a suggested category is attached, but left unconfirmed until Clean.

### 8.2 Clean an item
1. From the Inbox, user opens a `Captured` item.
2. Confirms/edits the suggested category.
3. Optionally sets a Project, one or more Goals, an Envelope, planned price, target date, and reminder schedule.
4. Saves — item moves to `Cleaned` and becomes active on the calendar, Upcoming/Overdue, and its Envelope's spend tracking.

### 8.3 Track budget
- Each Envelope shows allocated vs. spent vs. available, with a timeline of top-ups and completed purchases.
- Projects/Goals that have a dedicated Envelope show the same view scoped to them.
- An overall view rolls up totals across all Envelopes, plus any spend on items with no Envelope.

### 8.4 Get reminded
- If a `Cleaned` item has a target date and a reminder schedule, Nudge computes reminder dates by subtracting each offset from the target date.
- The dashboard's Upcoming/Overdue feed surfaces these. Reminders are in-app only — no email/push in v1.

### 8.5 Visualize on a calendar
- Calendar view plots `Cleaned` items by target date, color-coded by category or Project (TBD in design).
- Clicking a date/item opens item details.

### 8.6 Manage reminder schedules
- User can create/edit named offset lists (e.g. "Quick" = [3, 1], "Big purchase" = [30, 14, 7, 5, 3]) and reuse them across items in 2–3 clicks.

### 8.7 Complete an item
- User sets the actual price and flips stage to `Completed`. It drops out of Upcoming/Overdue, counts as spend against its Envelope, and joins the History log for its Project/Goal/Envelope.

## 9. Item Lifecycle & Stage

`Captured → Cleaned → Completed`, with `Cancelled` as a terminal escape hatch from either `Captured` or `Cleaned`. No "in progress/researching" sub-state in v1 — keep transitions simple to avoid friction.

## 10. Links & Enrichment

- `Item.link` is optional and can be added at capture or later, during Clean.
- Best-effort Open Graph scrape (title/image) from the link is a **stretch goal**, not required for v1 — if it doesn't ship, the link is just a plain clickable URL.

## 11. Budget & Envelopes

v1 uses **Envelopes** rather than a single spending-cap entity — closer to envelope budgeting (e.g. YNAB-style) than a simple budget field:

- An Envelope has a **name** and a **running allocated amount** built up from individual **top-ups** (e.g. adding R500 to "Clothes" every payday) — each top-up is recorded with an amount and date, so the Envelope has a visible timeline, not just a current balance.
- **Spent** = sum of actual prices of `Completed` items linked to the Envelope. **Available** = allocated − spent.
- An Envelope can be:
  - **Dedicated** to a single big-ticket Item (a savings target for one purchase),
  - **Shared** across many Items (e.g. one "Clothes" envelope that dozens of purchases draw from over years),
  - The de facto budget for a Project or a Goal, or
  - **Standalone**, with no Project/Goal at all (e.g. a general household "Misc" envelope).
- An Item optionally links to one Envelope, decided during Clean. (Whether an Item defaults to inheriting its Project's/Goal's Envelope automatically, versus always being chosen explicitly, is a SAD-level decision — not fixed here.)
- The household-wide budget view is simply the roll-up across all Envelopes (total allocated / spent / available), plus a separate figure for spend on items with no Envelope.
- Because `Completed` items are never deleted, every Envelope carries a permanent purchase history — this doubles as the "reward" record described in §7: open the "Clothes" envelope and see everything bought toward it.

This is deliberately the simplest version of envelope budgeting that supports the goal (financial planning + the reward of seeing completed spend) — no envelope-splitting across multiple buckets per item, no auto-rollover rules, no recurring top-up scheduling in v1.

## 12. Non-Functional Requirements

- Self-hosted by the user — favor simplicity and low resource use over horizontal scalability.
- **Deployment**: two Docker Compose files — one for plain `docker compose up` on any Docker host, one for Dokploy — kept as close to identical as possible (differences expected to be limited to networking/reverse-proxy labels, not service definitions). Finalized in the SAD.
- No auth/account system — not internet-exposed without a network-level access control of the user's choosing (e.g. a VPN or the host's reverse proxy).
- Mobile-responsive (phone browser is a primary capture surface); no PWA/offline requirement in v1.
- Data correctness for one household's data, not multi-tenant scale.

## 13. Out of Scope / Future (v2+)

- Price comparison across retailers ("find the right one").
- Email/push reminders.
- Multi-user support (e.g. shared household with separate logins).
- OG-tag link enrichment, if not completed as a v1 stretch goal.
- Recurring/templated items.
- Recurring/scheduled Envelope top-ups (e.g. "auto-add R500 on the 1st") — v1 top-ups are manual.
- Splitting a single item's cost across multiple Envelopes.

## 14. Assumptions Made in This Draft (please confirm or correct)

1. An Item links to **at most one Envelope** (not split across several) — keeps spend tracking unambiguous.
2. An Envelope links to **at most one Project or one Goal (not both), or neither** — avoids a many-to-many budget rollup in v1.
3. "Overdue" = target date has passed and stage is still `Cleaned` (not yet `Completed`/`Cancelled`).
4. Categories remain a managed/editable list (auto-seeded by Haiku suggestions), not free text — so the calendar/dashboard can filter/color-code by them.
5. No notification delivery beyond the in-app Inbox/Upcoming feed — opening the site is how you "get" a nudge, even on mobile.
6. Goals have no end date and no "done" state in v1 — just Active/Archived, since by definition they're ongoing.
7. A Project can optionally link to Goal(s) too (e.g. "Move to Joburg" serving a "Stable life in a new city" Goal) — not required, but allowed, since it costs nothing extra in the model.

## 15. Success Criteria

- User can go from "I need to remember X" to a saved capture in a couple of seconds — no fields beyond a name are ever required up front.
- The Inbox always reflects true backlog — nothing captured is ever silently lost; it's either still in the Inbox, Cleaned, Completed, or Cancelled.
- Dashboard answers "what do I need to handle this week, and can I afford it?" without manual calculation.
- Completed items remain visibly browsable as a reward log, not buried in an archive.
- Zero missed target dates that had a reminder schedule attached (the core "nudge" promise).
