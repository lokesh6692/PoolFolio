# PoolFolio — Master Project Plan (Updated)

> **Purpose of this file:** This is your single source of truth. If a Claude session ends or you lose context, upload/paste this file into a new chat and say: *"Continue PoolFolio from Phase X"* — everything needed to pick up exactly where you left off is here.

---

## 1. Project Identity (fixed names — don't change once you start coding)

| Item | Name |
|---|---|
| Project name | **PoolFolio** |
| GitHub repo name | `poolfolio` (public: `lokesh6692/PoolFolio`) |
| Backend module | `poolfolio-backend` (Spring Boot) |
| Frontend module | `poolfolio-frontend` (Next.js) |
| Docker Compose project name | `poolfolio` |
| Backend base package | `com.poolfolio.backend` |
| Database name | `poolfolio_db` |
| API base path | `/api/v1` |

### Core domain entities (use these exact names everywhere — DB tables, Java classes, TS types)

| Entity | DB table | Java class | Purpose |
|---|---|---|---|
| Group | `groups` | `InvestmentGroup` | A friend group pooling money |
| Member | `members` | `Member` | A user belonging to a group |
| Contribution | `contributions` | `Contribution` | Money a member adds/withdraws |
| Holding | `holdings` | `Holding` | A stock currently held by the group |
| IpoHolding | `ipo_holdings` | `IpoHolding` | An IPO currently held by the group — **tracked as a distinct entity from stock Holdings** (added Phase 1, post-Phase-2 design decision) |
| Trade | `trades` | `Trade` | A buy/sell transaction |
| Valuation | `valuations` | `ValuationSnapshot` | Point-in-time snapshot of pool value |
| ProfitShare | `profit_shares` | `ProfitShare` | Computed P&L share per member per snapshot |

---

## 2. Tech Stack (locked decisions from planning session)

- **Backend:** Java 21, Spring Boot 3, Spring Security + JWT, Spring Data JPA, Flyway, PostgreSQL, Redis (price cache)
- **Frontend:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Recharts
- **Live prices:** Finnhub (API key obtained/saved) — optional, manual entry always supported
- **Infra:** Docker + docker-compose, GitHub Actions CI/CD
- **Hosting (free):** Vercel (frontend), Render (backend web service only), **Neon** (Postgres, Singapore region, project `poolfolio-db`)
- **Testing:** JUnit5 + Mockito (backend), Vitest + React Testing Library (frontend)

---

## 3. Design Decisions Locked In (post-Phase-2 discussion — read before building Phase 3+)

These were settled after Phase 2 shipped, in response to clarifying how member-level cash/investment/profit tracking should work. They affect Phases 3, 4, and especially 5.

### 3.1 Contribution model
- `Contribution.type` is an **enum** (`DEPOSIT`, `WITHDRAWAL`) — amount is always stored **positive**. No signed-amount convention.
- Contributions are **self-only**: `memberId` is taken from the JWT claims, not the request body. Admin logging a contribution on behalf of another member is **out of scope for now** (deferred, same pattern as Phase 2's refresh-token deferral).
- Validation: `amount > 0`, non-null `date`. No "no negative running balance" rule — that's a solvency concern, not a contribution-validity concern.
- Running-total endpoint: per-member (live aggregate query) **and** group-total (cheap addition while in the repository layer).

### 3.2 IPO as a separate entity
- IPOs are tracked as a **distinct entity** (`IpoHolding` / `ipo_holdings` table) from stock `Holding`, not a shared table with an `instrumentType` discriminator.
- Added via additive Flyway migration `V10__add_ipo_holdings.sql` (does not touch/edit any previously-applied migration — same discipline as the V9 fix in Phase 2).
- Formula: `availableCash = totalContributed − (stockHoldings + ipoHoldings)`
  (Not `stockHoldings − ipoHoldings` — both are *uses* of cash, not offsetting each other.)

### 3.3 Withdrawal / exit model — Option 2 confirmed
Two options were considered for how a member "exits" a position:
1. ❌ Per-member individual exit from a specific holding (would require per-member cost-basis tracking within each `Holding`) — **not chosen**.
2. ✅ **Group trades as a single unit** (unchanged Phase 4 design — group-level `Trade`/`Holding`). Realized P&L from a group sell is **allocated to members via NAV-unit ratio at the time each unit was held** — not a flat/equal split, not today's ownership %.

This means **Phase 4 needs no schema change** for this decision — only the Phase 5 ratio engine needs to extend to realized P&L.

### 3.4 NAV-unit mechanics (worked example, for reference)
- New contributions buy units at the **current NAV per unit** at time of contribution — this is why timing matters and prevents free-riding on gains/losses that happened before someone joined.
- Realized P&L on a group sell = summed per member as: `member's units held × (NAV/unit at sale − NAV/unit when those units were bought)`.
- This is **not an equal split per person** and **not a flat % of total contributed** — it's proportional to unit-share, which already accounts for both contribution size and timing.
- Example: Alice contributes ₹10k (Jan 1, holds units start-to-finish); Bob contributes ₹10k (Jan 1) + ₹10k (Feb 1). Group buys stock for ₹20k (Jan 15), sells for ₹26k (Mar 1) → ₹6k profit. Split is **not** ₹3k/₹3k. Alice holds 1/3 of total units, Bob holds 2/3 → Alice gets ₹2,000, Bob gets ₹4,000.
- Caveat flagged for Phase 6: if the stock's value moves between purchase and a member's later contribution, that later contribution needs a live/marked valuation to price new units fairly — otherwise the new contributor over/underpays for units. Phase 6 (live prices) needs to feed into Phase 5's unit pricing, not be fully independent of it.

### 3.5 Reporting requirements for Phase 5
Per member **and** per group, Phase 5 must expose:

| Metric | Formula |
|---|---|
| Total contributed | deposits − withdrawals |
| Total invested | stock holdings + IPO holdings, at member's ratio |
| Available cash (without P&L) | total contributed − total invested |
| Realized profit/loss | sum of (sell − buy) on group trades, allocated by NAV-unit ratio at time held |
| Available cash (with P&L) | available cash (without P&L) + realized P&L allocated to that member |

### 3.6 Deferred to a later version (documented, not forgotten)
- **Group-selectable profit-share method** — letting a group choose `NAV_UNIT` vs. `EQUAL_SPLIT` vs. `FLAT_PERCENTAGE` at creation time. For now, **NAV-unit proportional is the only method**, hard-coded. (If revisited: method should be locked at group creation and immutable after, to avoid needing to retroactively recalculate historical trades under a new formula.)
- Admin logging a contribution on behalf of another member.
- Per-member individual exit from a specific holding (Option 1 above).

---

## 4. Phased Roadmap

**Structure:** Backend built fully first (API-first, tested via Swagger/Postman), then one dedicated Frontend block.

### Phase 0 — Setup & Scaffolding ✅ **COMPLETE**
- Java 21 Temurin, Node 20, Docker Desktop WSL2, Git, VS Code with extensions
- Backend/frontend folder structure, GitHub repo pushed
- Neon account + `poolfolio-db` (Singapore region) provisioned, connection string saved
- Render account, Vercel account, Finnhub API key saved

### Phase 1 — Database Schema & Migrations ✅ **COMPLETE** (+ 1 additive follow-up done)
- Flyway migrations V1–V9 for `groups`, `members`, `contributions`, `holdings`, `trades`, `valuations`, `profit_shares`
- Seed script with sample data for local dev
- Schema applied to both local Docker Postgres and Neon
- **V10 (added post-Phase-2):** `ipo_holdings` table — distinct entity from `holdings`, per §3.2. Applied and verified on both local (`now at version v10`) and Neon (`Schema "public" is up to date` after catching up 2 migrations). Committed and pushed.
- **Verified on Neon:** 8 domain tables exist (`groups`, `members`, `contributions`, `holdings`, `ipo_holdings`, `trades`, `valuations`, `profit_shares`) + `flyway_schema_history`. This matches 10 migrations correctly — V8 was a seed-data insert and V9 was a sequence fix, neither created a new table, so 10 migrations → 8 domain tables (7 from V1–V7 + 1 from V10) is expected, not a discrepancy.

### Phase 2 — Backend: Auth API ✅ **COMPLETE**
- Signup via `create-group` (become ADMIN, generates 6-char invite code) or `join-group` (become MEMBER via invite code)
- Login via email + password (email globally unique across all members)
- JWT (jjwt 0.13.0, HS512 auto-selected, 24h expiry, **no refresh token** — deliberate scope decision)
- BCrypt password hashing
- `GlobalExceptionHandler` for clean 400s on bad input / duplicate email / invalid invite code
- **Bugs hit and fixed:** deprecated jjwt `signWith` API; deprecated Spring `@NonNull` → JSpecify; identity sequence collision after seed data (fixed via `V9__fix_identity_sequences_after_seed.sql`, never editing the applied `V8`); `LazyInitializationException` on login (fixed by adding `@Transactional` to `login()`)
- **Note:** a "Using generated security password" warning has appeared in startup logs on both local and Neon profiles — not yet confirmed as harmless. **Action before Phase 3 builds more protected endpoints:** verify via Postman that `/api/v1/auth/login` and other `permitAll` routes still behave correctly and don't unexpectedly prompt for the generated password.
- Out of scope (documented): refresh tokens, password reset/email verification, login rate limiting, removing/leaving a group, regenerating invite code

### Phase 3 — Backend: Contributions API 🔶 **NEXT UP**
**Goal:** Track who put in what, when — per §3.1 design decisions above.
- [ ] `Contribution` entity: `type` enum (`DEPOSIT`/`WITHDRAWAL`), positive `amount`, `date`, `note`
- [ ] CRUD API for `Contribution`
- [ ] Running-total endpoint: per-member (from JWT `memberId`) + group-total
- [ ] Validation: `amount > 0`, non-null `date`
- [ ] Self-only authorization (admin-on-behalf explicitly deferred)
- **Done when:** Full contribution history and running totals (per-member and group) are correct via API calls.

### Phase 4 — Backend: Trades & Holdings API
**Goal:** Track what the group actually invested in — group-level, unchanged design (§3.3, Option 2).
- [ ] CRUD API for `Trade` and `Holding`
- [ ] CRUD API for `IpoHolding` (new, using `ipo_holdings` table from Phase 1)
- [ ] Holdings correctly derived/aggregated from trade history (group-level, not per-member)
- [ ] `availableCash = totalContributed − (stockHoldings + ipoHoldings)` computable at group level
- **Done when:** Group's current holdings (stock + IPO) are correctly computed from trade history via API.

### Phase 5 — Backend: Ratio & P&L Engine (the "hard part" — standout feature, scope grew per §3.4–3.5)
**Goal:** Correctly compute each member's ownership %, unrealized P&L, **and realized P&L**, per §3.5's table.
- [ ] Define and document the NAV-unit ratio model (`docs/design-decisions.md`)
- [ ] `ValuationSnapshot` creation (manual trigger or scheduled)
- [ ] `ProfitShare` calculation per snapshot — unrealized valuation (as originally planned)
- [ ] **New:** realized P&L calculation on group trade sells, allocated per member by NAV-unit ratio at time held
- [ ] **New:** available cash reported both **with** and **without** P&L, per member and per group
- [ ] Unit tests covering edge cases (member joins late, partial withdrawal, contribution timed mid-holding-period, etc.)
- **Done when:** You can explain and demo the math end-to-end with a worked example (see §3.4), all via API/tests.

### Phase 6 — Backend: Live Prices + Redis
**Goal:** Optional live valuation on top of manual entries.
- [ ] Integrate Finnhub for current stock prices
- [ ] Cache prices in Redis with TTL
- [ ] Fallback gracefully to last manual price if API fails
- [ ] **Note (per §3.4 caveat):** live/marked valuation needs to feed into Phase 5's NAV-unit pricing so new contributions after a price move are priced fairly
- **Done when:** An endpoint returns live-ish portfolio value with a visible "last updated" timestamp. **Backend is now feature-complete.**

### Phase 7 — Frontend: Auth & App Shell
- [ ] Login/signup pages, protected routes, JWT handling
- [ ] App shell: nav, group switcher, base layout (Tailwind + shadcn/ui)
- **Done when:** A user can log in and land on an empty but styled dashboard shell.

### Phase 8 — Frontend: Contributions & Trades Screens
- [ ] Contribution form + member contribution history view
- [ ] Trade entry form + holdings list view (stock + IPO)
- **Done when:** A member can log a contribution and a trade entirely through the UI.

### Phase 9 — Frontend: Dashboard & Visualizations
- [ ] "My Share" P&L breakdown view (with/without realized P&L, per §3.5)
- [ ] Portfolio value over time chart (Recharts)
- [ ] Per-member contribution vs. return chart
- [ ] Allocation by stock/IPO (pie/donut)
- [ ] Live price display with "last updated" timestamp
- [ ] Responsive, polished UI pass
- **Done when:** It looks good enough to screenshot for your portfolio/README.

### Phase 10 — Testing & CI/CD
- [ ] Backend unit + integration tests (target meaningful coverage on Phase 5 logic especially)
- [ ] Frontend component tests
- [ ] GitHub Actions: lint + test + build on every PR
- [ ] GitHub Actions: auto-deploy to Render (backend) / Vercel (frontend) on merge to `main`
- **Done when:** CI badge is green and deploys are automatic.

### Phase 11 — Deployment & Portfolio Packaging
- [ ] Deploy backend to Render, frontend to Vercel, DB already on Neon
- [ ] Use Neon's **pooled** connection string in Render's env vars
- [ ] Write `README.md` (problem, architecture diagram, tech stack, live demo link, screenshots/GIF)
- [ ] Write `docs/design-decisions.md` explaining the ratio/P&L logic in plain English (include the NAV-unit worked example from §3.4)
- [ ] Add project to resume/portfolio site with a 2-3 line pitch
- **Done when:** A stranger can open the README, understand the project in 60 seconds, and click a working live demo.

---

## 5. Git Commit Strategy

**Branch per phase:**
```
phase-0-setup
phase-1-db-schema
phase-2-auth-api
phase-3-contributions-api
phase-4-trades-holdings-api
phase-5-ratio-engine
phase-6-live-prices
phase-7-frontend-auth-shell
phase-8-frontend-contributions-trades
phase-9-frontend-dashboard
phase-10-testing-cicd
phase-11-deploy-portfolio
```

**Commit message format:** `<type>(phase-<n>): <short description>` — types: `feat`, `fix`, `test`, `docs`, `chore`, `refactor`.

**Rule of thumb:** commit after every checked-off checklist item.

**Commits so far (chronological, matches git log):**
```
feat(phase-0): scaffold spring boot and next.js projects with docker-compose
feat(phase-1): add flyway migrations for core schema, provision neon db
feat(phase-2): implement jwt-based signup and login
feat(phase-1): add ipo_holdings table as distinct entity from stock holdings   <- V10, done post-Phase-2
```

**Uncommitted / left as-is (intentional, not forgotten):**
- `README.md` — modified, not committed
- `PHASE_2_AUTH_API.md` — untracked, not committed

---

## 6. Resume-Session Prompt

Copy-paste this into a new Claude session anytime to continue:

> "I'm building **PoolFolio** — a group investment tracker (Spring Boot + Next.js). Here's my project plan file [attach this `PoolFolio_Project_Plan.md`]. I'm currently on **Phase 3**. Help me with [specific task]."

---

## 7. Status Tracker

| Phase | Status | Notes |
|---|---|---|
| 0 — Setup | ✅ Complete | |
| 1 — DB Schema | ✅ Complete | + V10 additive migration: `ipo_holdings` as separate entity, applied to local + Neon; table count verified on Neon (8 domain tables, matches migration history) |
| 2 — Backend: Auth API | ✅ Complete | Unverified: "generated security password" warning on startup — confirm `permitAll` routes unaffected before Phase 3 |
| 3 — Backend: Contributions API | 🔶 In progress (starting now) | Design locked per §3.1 |
| 4 — Backend: Trades/Holdings API | Not started | Scope includes new `IpoHolding` CRUD |
| 5 — Backend: Ratio/P&L Engine | Not started | Scope grew — realized P&L + cash-with/without-P&L, per §3.5 |
| 6 — Backend: Live Prices | Not started | Backend feature-complete after this |
| 7 — Frontend: Auth & Shell | Not started | |
| 8 — Frontend: Contributions/Trades | Not started | |
| 9 — Frontend: Dashboard | Not started | |
| 10 — Testing/CI-CD | Not started | |
| 11 — Deploy/Portfolio | Not started | |