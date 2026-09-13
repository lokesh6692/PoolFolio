# Phase 2 — Backend: Auth API

> Part of the PoolFolio project. See `PoolFolio_Project_Plan.md` for the full roadmap.

## Goal

Users can sign up, log in, and join a group securely — via API only, tested through Postman/Swagger.

**Done when:** register, log in, create a group, and invite a member all work end-to-end through Postman. ✅ Achieved.

---

## Design Decisions

### 1. There is no standalone "user" concept

Looking at the Phase 1 schema, `Member` has a mandatory (`nullable = false`) `ManyToOne` relationship to `InvestmentGroup`. There's no such thing as an account that exists independently of a group. This shaped the entire auth model:

- **Signup is not "create a user."** It's one of two actions:
  1. **Create a group** — provide email, password, display name, and a group name. A fresh invite code is generated, a new `InvestmentGroup` is created, and the caller becomes its first `Member` with role `ADMIN`.
  2. **Join a group** — provide email, password, display name, and an existing group's invite code. The caller becomes a `Member` with role `MEMBER`.
- **Login is just email + password.** Since `email` is globally unique across all members (regardless of group), one email always resolves to exactly one account.

### 2. Invite mechanism: short alphanumeric code, not a link

The plan left this open ("invite link or code"). We went with a 6-character code (e.g. `6F8E65`) because:
- No email/SMTP dependency needed for Phase 2.
- Trivially testable via Postman — no external delivery mechanism to fake.
- The code excludes visually ambiguous characters (`0`, `O`, `1`, `I`, `L`) for easy manual sharing.
- `InvestmentGroup.inviteCode` was already scaffolded as a unique, non-null column back in Phase 1, so this was the natural fit.

### 3. JWT strategy: access token only, no refresh token

Refresh tokens add real complexity (secure storage, rotation, revocation) that isn't justified until Phase 7, when a real frontend session needs managing. For an API-only phase tested via Postman, a single access token with a 24-hour expiry keeps scope tight. This is a deliberate, documented simplification — not an oversight — and can be layered in later without breaking the token shape.

---

## Architecture

```
HTTP Request
    │
    ▼
JwtAuthFilter (OncePerRequestFilter)
    │  reads "Authorization: Bearer <token>" header
    │  validates + parses JWT, populates SecurityContext
    ▼
SecurityFilterChain (SecurityConfig)
    │  /api/v1/auth/**        → permitAll
    │  /swagger-ui/**, /v3/api-docs/**, /api/v1/health → permitAll
    │  anything else          → authenticated
    ▼
AuthController
    │  POST /api/v1/auth/signup/create-group
    │  POST /api/v1/auth/signup/join-group
    │  POST /api/v1/auth/login
    ▼
AuthService (business logic, @Transactional)
    │  - generates unique invite codes
    │  - hashes passwords (BCrypt)
    │  - creates InvestmentGroup + Member, or looks one up
    │  - issues JWTs via JwtUtil
    ▼
MemberRepository / InvestmentGroupRepository (Spring Data JPA)
    ▼
PostgreSQL (Docker locally / Neon in the cloud)
```

### Package layout added this phase

```
com.poolfolio.backend
├── controller/
│   ├── AuthController.java
│   └── GlobalExceptionHandler.java
├── dto/
│   ├── SignupCreateGroupRequest.java
│   ├── SignupJoinGroupRequest.java
│   ├── LoginRequest.java
│   └── AuthResponse.java
├── repository/
│   ├── MemberRepository.java
│   └── InvestmentGroupRepository.java
├── security/
│   ├── JwtUtil.java
│   ├── JwtAuthFilter.java
│   └── SecurityConfig.java
└── service/
    └── AuthService.java
```

---

## Endpoints

| Method | Path | Auth required | Purpose |
|---|---|---|---|
| POST | `/api/v1/auth/signup/create-group` | No | Register + create a new group as ADMIN |
| POST | `/api/v1/auth/signup/join-group` | No | Register + join an existing group via invite code, as MEMBER |
| POST | `/api/v1/auth/login` | No | Authenticate and receive a fresh JWT |

### Sample request/response — create group

**Request**
```json
POST /api/v1/auth/signup/create-group
{
  "email": "alice@test.com",
  "password": "password123",
  "displayName": "Alice",
  "groupName": "The Bulls"
}
```

**Response**
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "memberId": 5,
  "email": "alice@test.com",
  "displayName": "Alice",
  "groupId": 3,
  "groupName": "The Bulls",
  "inviteCode": "6F8E65",
  "role": "ADMIN"
}
```

### Sample request/response — join group

**Request**
```json
POST /api/v1/auth/signup/join-group
{
  "email": "bob@test.com",
  "password": "password123",
  "displayName": "Bob",
  "inviteCode": "6F8E65"
}
```

**Response** — same shape, `"role": "MEMBER"`, same `groupId` as the admin who created it.

### Sample request/response — login

**Request**
```json
POST /api/v1/auth/login
{
  "email": "alice@test.com",
  "password": "password123"
}
```

**Response** — same shape as signup, reissuing a fresh token for the existing account.

---

## Key Implementation Details

### JWT (jjwt 0.13.0)

- Signing key built from a configured secret via `Keys.hmacShaKeyFor(...)`.
- Token claims: subject = email, plus custom `memberId` and `groupId` claims, so downstream requests can resolve identity without a database round-trip just to know which group a request belongs to.
- `signWith(key)` (no explicit algorithm) lets jjwt auto-select the strongest HMAC variant for the key's byte length — it chose HS512 here, stronger than the HS256 we originally assumed we'd get.
- Config lives in `application.yml` under `app.jwt.secret` and `app.jwt.expiration-ms` (default 24h).

### Password security

- BCrypt via Spring Security's `BCryptPasswordEncoder`, used both when hashing on signup and via `.matches(...)` on login. Raw passwords are never persisted or logged.

### Error handling

`GlobalExceptionHandler` (`@RestControllerAdvice`) converts:
- `IllegalArgumentException` (duplicate email, invalid invite code, wrong credentials) → clean `400` JSON with a message.
- `MethodArgumentNotValidException` (Bean Validation failures on the DTOs) → `400` JSON with a per-field error map.

Both replace what would otherwise be raw Spring stack-trace responses.

---

## Bugs Hit and Fixed This Phase

These turned out to be more instructive than the "happy path" work, so documenting them here rather than letting the fixes disappear into git history alone.

### 1. Deprecated jjwt signing API

**Symptom:** compiler warning on `.signWith(key, SignatureAlgorithm.HS256)`.
**Cause:** jjwt 0.13.0 deprecated the two-argument `signWith` in favor of the single-argument `signWith(key)`, which infers the algorithm from the key.
**Fix:** dropped the explicit algorithm argument and the now-unused `SignatureAlgorithm` import.

### 2. Deprecated Spring null-safety annotation

**Symptom:** compiler warning on `@NonNull` in `JwtAuthFilter`.
**Cause:** Spring Framework 7 (bundled with Spring Boot 4.1.1) deprecated `org.springframework.lang.NonNull` in favor of JSpecify's `org.jspecify.annotations.NonNull`.
**Fix:** swapped the import. No new dependency needed — JSpecify ships transitively with Spring Framework 7.

### 3. Identity sequence collision after seed data (the big one)

**Symptom:** `duplicate key value violates unique constraint "groups_pkey" ... Key (id)=(1) already exists` on the very first real signup.
**Cause:** the Phase 1 seed migration (`V8`) inserted rows with explicit `id` values (`1, 2, 3...`). Postgres's identity sequence only auto-advances on inserts that *omit* the id column — explicit inserts bypass it entirely. So the sequence still thought "1" was the next free id, colliding with the seed row that already used it.
**Fix:** added `V9__fix_identity_sequences_after_seed.sql`, using `setval(pg_get_serial_sequence(table, 'id'), COALESCE(MAX(id), 1))` for every affected table. Never edited `V8` directly — modifying an already-applied Flyway migration breaks its checksum.
**Lesson:** any seed data with explicit primary keys needs an explicit sequence-realignment step afterward.

### 4. LazyInitializationException on login (looked like a 403, wasn't)

**Symptom:** Postman showed a generic failure that was initially misdiagnosed as a `403`; the actual server log showed a `500` with `org.hibernate.LazyInitializationException: could not initialize proxy [InvestmentGroup#3] - no session`.
**Cause:** `Member.group` is `FetchType.LAZY`. `signupCreateGroup` and `signupJoinGroup` were both `@Transactional`, but `login()` was not — so by the time `buildAuthResponse` tried to read `group.getName()` from the lazily-loaded proxy, the Hibernate session had already closed.
**Fix:** added `@Transactional` to `login()` as well, keeping the session open long enough to resolve the proxy.
**Lesson:** always check the actual server-side stack trace before trusting a client-reported status code — the real error here had nothing to do with security or authorization.

---

## What's Explicitly Out of Scope (by design, for now)

- Refresh tokens / token rotation
- Password reset / email verification
- Rate limiting on login attempts
- Removing a member from a group, or leaving a group
- Regenerating an invite code

These are reasonable follow-ups but weren't required by this phase's "Done when" criteria, and adding them now would have expanded scope beyond what the plan called for.
