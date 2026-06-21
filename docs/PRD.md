# Nudge — Product Requirements Document

## 1. Summary

Nudge is a personal household planning app for a single "smart but forgetful" user. It tracks things that need to be bought or arranged — optionally grouped into projects (e.g. "Move to Joburg") — with target dates, budgets, and reminders, so nothing falls through the cracks. v1 is shopping-list + budget tracking + calendar + reminders. Finding the *best* version of an item (price comparison across retailers) is explicitly deferred to v2.

## 2. Problem

The user juggles recurring and one-off household purchases/tasks (groceries, moving prep, gifts, home projects) across different timelines and budgets, with no single place that tells them "here's what's coming up, and what it'll cost." Generic to-do apps don't carry price/budget context; spreadsheets don't nudge.

## 3. Goals (v1)

- One place to capture "things to buy/arrange," each with a price estimate and optional target date.
- Group items into projects with their own budget and timeline.
- Get reminded at multiple lead times before a target date, without having to set each reminder by hand.
- See spend (planned vs actual) at a glance, per project and overall.
- Visualize what's due when, on a calendar.
- Low friction to add an item — categorization shouldn't require the user to think.

## 4. Non-Goals (v1)

- No multi-user/roles — single shared passphrase, one household.
- No price comparison / "find the best deal" across retailers (v2).
- No push/email notifications — in-app only.
- No native mobile app — responsive web only.
- No automatic recurring items (e.g. "buy milk every week") — every item is added explicitly.

## 5. Target User

One person (the household's planner) using it from both desktop and phone browser. Optimized for fast capture (add an item in a few seconds) and a glanceable dashboard, not for power-user data entry.

## 6. Core Concepts

| Entity | Purpose |
|---|---|
| **Item** | A thing to buy/arrange. Has a name, category, optional project, planned price, actual price (once purchased), optional target date, optional link, status, and optional reminder schedule. |
| **Category** | Classification for an item (e.g. "Furniture," "Groceries"). Suggested automatically, user-editable. |
| **Project** | Optional grouping of items with a shared goal, timeline, and budget (e.g. "Move to Joburg"). |
| **Budget** | A spending cap — can apply to a project, or stand alone as an overall household budget. Tracked as planned vs. actual. |
| **ReminderSchedule** | A named, reusable list of day-offsets before a target date (e.g. "Standard prep" = [30, 14, 7, 5, 3]). Assigned to an item to generate its reminders. |

## 7. Key Flows

### 7.1 Add an item
1. User enters a name (and, optionally, a link to the product/page).
2. App calls Claude Haiku with the name (+ link if present) and gets back a suggested category and tags as pre-filled, editable fields — no hardcoded keyword list.
3. User confirms/edits category, optionally sets project, planned price, target date, and reminder schedule.
4. Item is saved with status `Planned`.

### 7.2 Track budget
- Each project shows planned vs. actual spend against its budget (if set).
- A dashboard-level overall budget shows the same roll-up across all items (project or no project).
- Over-budget states are visually flagged.

### 7.3 Get reminded
- If an item has a target date and a reminder schedule, Nudge computes reminder dates by subtracting each offset from the target date.
- A dashboard feed shows "Upcoming" (reminders due soon) and "Overdue" (target date passed, item still `Planned`).
- Reminders are in-app only — no email/push in v1.

### 7.4 Visualize on a calendar
- Calendar view plots items by target date, color-coded by category or project (TBD in design).
- Clicking a date/item opens item details.

### 7.5 Manage reminder schedules
- User can create/edit named offset lists (e.g. "Quick" = [3, 1], "Big purchase" = [30, 14, 7, 5, 3]) and reuse them across items in 2–3 clicks.

### 7.6 Mark an item purchased
- User sets actual price and flips status to `Purchased`; it drops out of Upcoming/Overdue and counts toward actual spend.

## 8. Item Status

`Planned → Purchased`, with `Cancelled` as a terminal escape hatch (item no longer needed, excluded from budget/reminders). No "in progress/researching" state in v1 — keep it binary to avoid friction.

## 9. Links & Enrichment

- `Item.link` is optional and can be added at creation or later.
- Best-effort Open Graph scrape (title/image) from the link is a **stretch goal**, not required for v1 — if it doesn't ship, the link is just a plain clickable URL.

## 10. Non-Functional Requirements

- Self-hosted by the user (Docker Compose on their own Dokploy instance) — favor simplicity and low resource use over horizontal scalability.
- Single shared passphrase auth; no account system, password resets, or email flows.
- Mobile-responsive (phone browser is a primary capture surface); no PWA/offline requirement in v1.
- Data correctness for one household's data, not multi-tenant scale.

## 11. Out of Scope / Future (v2+)

- Price comparison across retailers ("find the right one").
- Email/push reminders.
- Multi-user support (e.g. shared household with separate logins).
- OG-tag link enrichment, if not completed as a v1 stretch goal.
- Recurring/templated items.

## 12. Assumptions Made in This Draft (please confirm or correct)

1. **Budget model**: Budget is not its own free-standing entity with history — it's a cap (planned amount) attached to a Project, plus one implicit overall household budget. If you wanted multiple named overall budgets (e.g. monthly envelopes), flag it now since it changes the data model.
2. **"Overdue"** = target date has passed and status is still `Planned`. Cancelled/Purchased items are never overdue.
3. **Status taxonomy** kept to three values (`Planned`/`Purchased`/`Cancelled`) — no "researching" or "ordered/in transit" states.
4. **Categories** are a managed list (auto-created from Haiku suggestions, editable/mergeable by the user) rather than pure free-text tags, so the calendar/dashboard can color-code and filter by them.
5. No notification delivery beyond in-app feed — confirming this stays true even on mobile (i.e. opening the site is how you "get" a reminder, not a phone notification).

## 13. Success Criteria

- User can go from "I need to buy X" to a saved, categorized item in under ~15 seconds.
- Dashboard answers "what do I need to handle this week, and can I afford it?" without manual calculation.
- Zero missed target dates that had a reminder schedule attached (the core "nudge" promise).
