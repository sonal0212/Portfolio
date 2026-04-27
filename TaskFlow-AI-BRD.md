# TaskFlow AI — Business Requirements Document

| Field | Value |
|---|---|
| Project Name | TaskFlow AI |
| Document Version | 1.0 |
| Status | Draft for Implementation |
| Owner | Sonal Singh |
| Last Updated | 2026-04-28 |
| Document Type | Business Requirements Document (BRD) |

---

## 1. Executive Summary

TaskFlow AI is a full-stack, AI-augmented task management platform that lets individuals and teams capture, organise, prioritise and collaborate on work in real time. Unlike traditional Kanban tools, TaskFlow AI uses an LLM (GPT-4o-mini via Spring AI) to suggest tasks, auto-prioritise the backlog, summarise progress, and surface bottlenecks. Multi-user collaboration is delivered through a STOMP-over-WebSocket layer so changes propagate to every connected client within ~200 ms. Authentication is short-lived JWT (15-minute access tokens) with rotating 7-day refresh tokens and Redis-backed token blacklisting. A Redis read-through cache fronts PostgreSQL and is targeted to cut database read load by ≥60 % under concurrent usage.

This document is the single source of truth for scope, requirements, architecture and acceptance criteria. It is detailed enough that an engineer can build TaskFlow AI from scratch using only this BRD plus the named libraries.

---

## 2. Business Context & Objectives

### 2.1 Problem Statement
- Existing tools (Trello, Jira, Asana) require constant manual triage; users spend more time grooming the board than doing the work.
- AI features in those tools are bolted on, not first-class — they cannot suggest a sensible next task or re-rank a backlog from raw context.
- Real-time collaboration is shallow: edits often require a refresh, and presence is rarely shown.

### 2.2 Vision
"A task manager that thinks alongside you." Every task surface — list, board, calendar — is augmented with an AI co-pilot that reads the workspace and proposes the next move.

### 2.3 Business Objectives
| ID | Objective | Measurable Target |
|---|---|---|
| BO-1 | Reduce manual backlog grooming time | ≥ 30 % less time per user per week (self-reported) |
| BO-2 | Real-time collaboration parity with Notion/Linear | < 250 ms median update propagation |
| BO-3 | Cost-efficient AI usage | < $0.01 per active user per day in LLM cost |
| BO-4 | Database scalability | ≥ 60 % cache hit rate on read endpoints |
| BO-5 | Security posture | Zero plaintext token storage; refresh token rotation on every use |

### 2.4 Success Criteria
- 95 % of P1/P2 functional requirements pass acceptance tests.
- Performance NFRs (Section 8) hit in load test at 500 concurrent users.
- Security review (OWASP ASVS L2) passes with no Critical/High findings.

---

## 3. Stakeholders

| Stakeholder | Responsibility |
|---|---|
| Product Owner | Prioritises backlog, owns roadmap, accepts deliverables |
| Tech Lead | Architecture decisions, code review, NFR sign-off |
| Backend Engineer(s) | Spring Boot services, AI pipeline, WebSocket layer |
| Frontend Engineer(s) | Next.js app, real-time UI, optimistic updates |
| DevOps / SRE | CI/CD, infra, observability, secret management |
| Security Reviewer | Threat model, ASVS audit, dependency scanning |
| End Users | Individuals, small teams (2–25 members per workspace) |

---

## 4. Scope

### 4.1 In Scope (MVP → v1.0)
- Workspaces, projects, tasks, sub-tasks, comments, attachments (links only at MVP).
- Multi-user collaboration with presence and live cursors on the board view.
- AI features: task suggestion, auto-prioritisation, natural-language task creation, daily standup summary.
- Auth: email + password, JWT access tokens, refresh-token rotation, optional Google OAuth (Phase 2).
- Notifications: in-app real-time + email digest.
- Search across tasks/comments (Postgres full-text search).
- Light / dark mode, responsive layout (≥ 360 px width).

### 4.2 Out of Scope (v1.0)
- Mobile native apps (web-responsive only).
- File uploads / object storage (link attachments only).
- Time tracking, invoicing, Gantt charts.
- Self-hosted / on-prem deployment.
- SSO / SAML.
- Voice input.

### 4.3 Assumptions
- Users have modern evergreen browsers (last 2 versions of Chrome/Firefox/Safari/Edge).
- OpenAI API is available; the system tolerates AI-feature degradation but not full outage.
- PostgreSQL 15+ and Redis 7+ are available.

### 4.4 Constraints
- LLM cost cap of $0.01 per DAU per day (BO-3) drives use of GPT-4o-mini and aggressive caching.
- All data is stored in a single region (no cross-region replication at v1.0).
- Free tier limited to 1 workspace, 3 collaborators, 100 tasks (drives upgrade later).

---

## 5. User Personas

### 5.1 Persona A — The Solo Maker ("Priya")
Freelance designer, 2–3 active projects, wants a clean inbox + AI to cut decision fatigue. Uses TaskFlow on a 13" laptop, mostly list view.

### 5.2 Persona B — The Team Lead ("Marco")
Engineering lead of a 6-person team. Cares about real-time visibility, prioritisation, and surfacing blockers. Uses board view + standup summaries.

### 5.3 Persona C — The Contributor ("Amara")
Engineer on Marco's team. Wants the smallest possible interface — see what's assigned to me, mark it done. Heavy keyboard user (uses shortcuts).

---

## 6. User Stories (Epics → Stories)

Stories are tagged with priority: P1 = MVP-blocking, P2 = MVP-nice-to-have, P3 = post-MVP.

### Epic E1 — Authentication & Account
- **US-1.1 (P1)** As a new user, I can sign up with email + password so I can create a workspace.
- **US-1.2 (P1)** As a returning user, I can log in and stay logged in across short sessions without re-typing credentials.
- **US-1.3 (P1)** As a user, I can log out and have my refresh token invalidated immediately.
- **US-1.4 (P1)** As a user, my password is never stored in plaintext.
- **US-1.5 (P2)** As a user, I can log in with Google OAuth.
- **US-1.6 (P2)** As a user, I can request a password reset by email.

### Epic E2 — Workspace & Project Structure
- **US-2.1 (P1)** As a user, I can create a workspace and become its owner.
- **US-2.2 (P1)** As an owner, I can invite collaborators by email and assign roles (Owner, Admin, Member, Viewer).
- **US-2.3 (P1)** As a member, I can create projects inside a workspace.
- **US-2.4 (P1)** As a viewer, I cannot create or edit, only read.

### Epic E3 — Tasks
- **US-3.1 (P1)** As a member, I can create a task with title, description, due date, priority, status, assignee, labels.
- **US-3.2 (P1)** As a member, I can edit, delete, or change the status of a task I have access to.
- **US-3.3 (P1)** As a member, I can comment on a task and @mention a collaborator.
- **US-3.4 (P1)** As a member, I can drag tasks across columns (Todo → In Progress → Done).
- **US-3.5 (P2)** As a member, I can create sub-tasks under a task.
- **US-3.6 (P2)** As a member, I can attach links (URLs) to a task.
- **US-3.7 (P2)** As a member, I can search across all tasks I have access to.

### Epic E4 — Real-time Collaboration
- **US-4.1 (P1)** When another collaborator creates/edits/deletes a task, I see the change within 250 ms without a refresh.
- **US-4.2 (P1)** I can see avatars of who is currently viewing the same project.
- **US-4.3 (P2)** I see a live cursor / typing indicator in shared comment threads.
- **US-4.4 (P1)** Concurrent edits to the same task field are resolved last-write-wins with a toast warning.

### Epic E5 — AI Features
- **US-5.1 (P1)** Given a project context, I can ask AI to "suggest 5 next tasks" and accept/reject each.
- **US-5.2 (P1)** I can ask AI to "auto-prioritise my backlog" and review proposed priorities before applying.
- **US-5.3 (P1)** I can type a natural-language sentence ("schedule a 30-min review with Marco on Friday") and have it parsed into a task with assignee, due date, duration.
- **US-5.4 (P2)** I receive a daily standup summary at 9 am workspace time.
- **US-5.5 (P2)** I can ask "what's blocking project X?" and get a structured answer with citations to specific tasks.

### Epic E6 — Notifications
- **US-6.1 (P1)** When I am @mentioned or assigned, I see an in-app notification within 1 s.
- **US-6.2 (P2)** I receive a daily email digest of unread notifications.

### Epic E7 — Account/Workspace Settings
- **US-7.1 (P1)** I can change my display name, avatar, password.
- **US-7.2 (P1)** Owner can rename, archive, or delete a workspace.
- **US-7.3 (P2)** Workspace settings include default timezone (used by AI features).

---

## 7. Functional Requirements (Detailed)

> Numbering convention: FR-{epic}.{seq}. Each FR has Priority, Description, Inputs, Outputs, Validation, Errors.

### FR-1.1 — Sign Up (P1)
- **Description:** Create a new user account with email + password.
- **Inputs:** `email` (RFC 5322 valid, ≤ 254 chars), `password` (≥ 10 chars, ≥ 1 upper, ≥ 1 digit, ≥ 1 symbol), `displayName` (≤ 60 chars).
- **Process:** Hash password with BCrypt (work factor 12). Insert into `users`. Create personal workspace. Return JWT pair.
- **Outputs:** `{ accessToken, refreshToken, user }`.
- **Errors:** 409 if email exists; 400 if validation fails.

### FR-1.2 — Login (P1)
- **Description:** Authenticate user; issue JWT pair.
- **Inputs:** `email`, `password`.
- **Process:** Look up user; verify BCrypt; if verified, mint access JWT (15 min) and refresh JWT (7 d); store refresh-token-hash + jti in Redis with 7 d TTL.
- **Outputs:** `{ accessToken, refreshToken }`.
- **Errors:** 401 on bad credentials (constant time response). After 5 failures in 15 min for an email, lock for 15 min (Redis counter).

### FR-1.3 — Refresh Token (P1)
- **Description:** Exchange a valid refresh token for a new access + refresh token pair (rotation).
- **Process:** Verify signature + expiry. Look up `jti` in Redis blacklist; if present, reject as compromised — invalidate ALL refresh tokens for that user (write a "user-token-version" bump in Redis). Otherwise, blacklist current `jti`, mint new pair.
- **Errors:** 401 on invalid/expired/blacklisted; 403 if user account is disabled.

### FR-1.4 — Logout (P1)
- **Description:** Invalidate current refresh token immediately.
- **Process:** Add the refresh token's `jti` to Redis blacklist with TTL = remaining lifetime; access token expires naturally.

### FR-2.1 — Create Workspace (P1)
- **Description:** Create workspace; creator becomes Owner.
- **Inputs:** `name` (≤ 80), `slug` (auto-derived, unique), `timezone` (IANA, default UTC).
- **Outputs:** Workspace record + membership row.

### FR-2.2 — Invite Collaborator (P1)
- **Description:** Send email invite; create pending membership.
- **Inputs:** `email`, `role ∈ {Admin, Member, Viewer}`. Owner role is non-transferable via invite.
- **Process:** Token-based invite link valid 7 d. On acceptance, membership row is created; if user does not exist, sign-up flow is triggered first.

### FR-3.1 — Create Task (P1)
- **Description:** Create a task in a project.
- **Inputs:** `projectId`, `title` (≤ 200), `description` (≤ 5000, markdown), `priority ∈ {P0, P1, P2, P3}`, `status ∈ {TODO, IN_PROGRESS, BLOCKED, DONE}`, `assigneeId?`, `dueDate?`, `labels?` (≤ 10).
- **Process:** Insert into `tasks`. Insert task into outbox (Section 9) for WebSocket fan-out. Bust Redis cache key for project task list.

### FR-3.2 — Update Task (P1)
- **Description:** Update task fields.
- **Process:** Optimistic concurrency via `version` column (`UPDATE … WHERE id = ? AND version = ?`). On version mismatch, return 409 with current task; client merges or shows toast (US-4.4).

### FR-3.3 — Delete Task (P1)
- Soft delete: set `deletedAt`. List endpoints filter by `deletedAt IS NULL`. Hard delete only for workspace owners after 30 days.

### FR-4.1 — Real-time Updates (P1)
- See Section 9.4 (Real-time Layer).

### FR-5.1 — Suggest Tasks (P1)
- **Description:** Given a project, return 5 suggested tasks (title + description + suggested priority).
- **Process:**
  1. Build context: project name, last 30 tasks (title + status), workspace timezone.
  2. Call OpenAI via Spring AI with prompt template (Appendix A).
  3. Validate response is JSON conforming to `TaskSuggestionList` schema; reject if not.
  4. Cache response for 60 s by `(projectId, contextHash)`.
- **Output:** Array of `{ title, description, suggestedPriority }`.
- **Errors:** 503 if OpenAI returns 5xx after 2 retries (exponential backoff 250 ms, 1 s).

### FR-5.2 — Auto-prioritise Backlog (P1)
- **Description:** Re-rank all `TODO` tasks in a project.
- **Process:** Fetch tasks; build prompt with each task title, due date, dependencies; LLM returns ordered list of task IDs with new priority; client receives diff (current → proposed) and the user explicitly confirms before write.
- **Validation:** Returned IDs must be a subset of input IDs; if any unknown ID is returned, abort and return 502.

### FR-5.3 — Natural-language Task Creation (P1)
- **Description:** Parse a free-text sentence into a task.
- **Process:** Send sentence + workspace context to LLM with structured-output schema (`title, assigneeHint?, dueDate?, durationMinutes?, priority?`). Resolve `assigneeHint` against workspace members by fuzzy match (Levenshtein ≤ 2 on display name); if ambiguous, return candidates to client. Resolve `dueDate` strings ("Friday", "next Monday 3 pm") relative to workspace timezone.

### FR-6.1 — Notifications (P1)
- Triggered by: assignment, @mention, comment on a task you authored, status change to BLOCKED on tasks where you are assignee.
- Persisted in `notifications`. Pushed via WebSocket. Marked read on view.

---

## 8. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-1 | Performance | P95 API latency < 250 ms for read; < 400 ms for write (excluding AI calls), at 500 concurrent users. |
| NFR-2 | Performance | WebSocket update propagation P95 < 250 ms from publish to client receive. |
| NFR-3 | Scalability | Stateless backend; horizontal scale by adding pods. WebSocket layer uses Redis pub/sub for fan-out across instances. |
| NFR-4 | Caching | ≥ 60 % cache hit rate on `GET /projects/{id}/tasks` under steady-state load (BO-4). |
| NFR-5 | Availability | 99.5 % monthly. AI features may degrade independently. |
| NFR-6 | Security | OWASP ASVS L2. No plaintext secrets in repo. Refresh tokens rotated on every use. |
| NFR-7 | Security | All endpoints HTTPS only; HSTS enabled. |
| NFR-8 | Privacy | LLM provider never receives user PII other than display name; emails stripped before prompting. |
| NFR-9 | Observability | Structured JSON logs; request-id propagation; Prometheus metrics; OpenTelemetry traces for HTTP and AI calls. |
| NFR-10 | Cost | LLM token usage logged per user per day; alerts when > 2× rolling 7-day avg. |
| NFR-11 | Accessibility | WCAG 2.1 AA on all primary flows. |
| NFR-12 | Browser Support | Last 2 versions of Chrome, Firefox, Safari, Edge. |
| NFR-13 | i18n | Strings externalised; v1.0 ships English only. |
| NFR-14 | Backups | Daily logical Postgres backup, 30-day retention. |

---

## 9. System Architecture

### 9.1 High-Level Components

```
┌─────────────────────┐     HTTPS / WSS    ┌────────────────────────┐
│  Next.js (App Router)│ ─────────────────► │  Spring Boot API       │
│  React 18 + TS + SWR │ ◄───────────────── │  (REST + STOMP/WS)     │
└─────────────────────┘                    └─────────┬──────────────┘
        │                                            │
        │                                            ├─► PostgreSQL 15
        │                                            ├─► Redis 7 (cache + tokens + pub/sub)
        │                                            └─► OpenAI (via Spring AI)
```

### 9.2 Backend Layering (Spring Boot)
- `controller` — REST + STOMP endpoints, request validation (Bean Validation).
- `service` — business logic, transactional boundaries.
- `repository` — Spring Data JPA + JdbcTemplate for cache-friendly queries.
- `domain` — JPA entities + value objects.
- `ai` — Spring AI prompt templates, response parsers, retries.
- `security` — JWT filter, refresh-token service, role checks.
- `realtime` — STOMP message brokers, presence service, Redis pub/sub bridge.
- `cache` — Redis abstractions (read-through / write-around).

### 9.3 Frontend Structure (Next.js 14, App Router)
- `app/(auth)/login`, `app/(auth)/signup` — public routes.
- `app/(app)/[workspace]/[project]` — main board.
- `lib/api` — typed fetch client (zod-validated).
- `lib/ws` — STOMP client wrapper (`@stomp/stompjs`).
- `lib/auth` — token storage (access in memory, refresh in HTTP-only cookie set by backend).
- `components/board`, `components/task`, `components/ai` — UI primitives.

### 9.4 Real-time Layer (STOMP over WebSocket)
- Endpoint: `/ws` upgrades to WSS.
- Subscriptions:
  - `/topic/project/{projectId}` — task CRUD + comment events.
  - `/topic/workspace/{workspaceId}/notifications` — per-user notifications via user-destination prefix.
  - `/topic/project/{projectId}/presence` — join/leave/cursor events.
- Authentication: STOMP `CONNECT` frame carries the access JWT in `Authorization` header; backend validates and binds principal.
- Fan-out across multiple backend pods: Spring uses an external relay configured to use Redis pub/sub channel `tf.events.*`. Each backend listens and rebroadcasts to local WebSocket subscribers.
- Outbox pattern: every write that needs broadcasting first inserts a row into `event_outbox` in the same DB transaction. A scheduled worker (every 200 ms) reads pending rows and publishes to Redis. Guarantees at-least-once delivery; consumers are idempotent by `eventId`.

### 9.5 Caching Strategy
- **Read-through** for `GET /projects/{id}/tasks` and `GET /tasks/{id}`. Key format: `tasks:project:{id}:v{schemaVersion}`. TTL 60 s. Cached payload is JSON.
- **Write-through invalidation:** on any task write, the service publishes a cache-invalidate message; all pods evict the affected keys.
- **Per-user keys** for hot endpoints (`GET /me/notifications`) with 30 s TTL.
- **AI-response caching** keyed by `(endpoint, projectId, contextHash)` for 60 s — prevents accidental duplicate LLM calls under React StrictMode / double-clicks.
- **Target metric:** Redis hit rate ≥ 60 % over 7-day window (NFR-4).

### 9.6 Security Architecture

**Auth Tokens**
- Access token: JWT, HS256, 15 min, claims: `sub` (userId), `wsIds` (workspace IDs), `roles`, `tokenVersion`, `iat`, `exp`, `jti`. Stored in memory by SPA.
- Refresh token: opaque random 256-bit string, hashed with SHA-256, stored as HTTP-only Secure SameSite=Strict cookie. The hash + `jti` + userId + expiry is stored in Redis (`refresh:{jti}` → metadata, TTL 7 d).
- Rotation: on every refresh, current `jti` is added to a blacklist set (`blacklist:{userId}`) until original expiry; new pair is issued.
- Compromise detection: re-use of an already-rotated `jti` revokes ALL refresh tokens for that user (token-version bump).

**Other**
- BCrypt 12 for passwords; pepper stored in env, not DB.
- Rate limit: 100 req/min/IP global; 5 login/min/IP; 30 AI calls/min/user.
- CORS: only the configured frontend origin.
- CSRF: not applicable since we use Bearer tokens for state-changing requests; refresh-token cookie is `SameSite=Strict`.
- Input: Bean Validation on every DTO. Output: explicit JSON serialisation (no field leakage).
- SQL: parameterised queries only; JPA + named parameters where dynamic.
- Secrets: env vars; `.env.local` git-ignored; production uses platform secret manager.
- Logging: never log tokens, password, prompt content with PII.

### 9.7 AI Integration (Spring AI + GPT-4o-mini)
- Default model: `gpt-4o-mini` (cost-optimal). Long-context tasks may upgrade to `gpt-4o` with explicit feature flag.
- All prompts use **structured output** (JSON schema) to ensure deterministic parsing.
- All prompts are versioned and stored under `src/main/resources/prompts/v{n}/`.
- Each AI service method:
  1. Validates input.
  2. Strips PII (emails replaced with `<member-1>` etc.; mapping retained for response post-processing).
  3. Builds prompt from template.
  4. Calls model with timeout 8 s, max retries 2, exponential backoff.
  5. Parses + schema-validates response (Jackson + json-schema-validator).
  6. Records token usage in `ai_usage` table (userId, feature, promptTokens, completionTokens, costCents).
  7. Returns DTO.
- Failure mode: AI features return `{ unavailable: true, reason }` and the UI degrades to non-AI workflow.

### 9.8 Deployment Topology (Reference)
- Frontend: Vercel or any Node 20 host running `next start`.
- Backend: containerised Spring Boot, 2+ pods behind a load balancer with sticky sessions disabled (WS uses Redis relay so any pod handles any client).
- PostgreSQL: managed (e.g., Supabase, RDS), single region, daily backup.
- Redis: managed, persistence enabled (AOF every-second).
- CI: GitHub Actions — lint, test, build, image push, deploy.

---

## 10. Data Model

### 10.1 Entity-Relationship Overview
```
users ─< memberships >─ workspaces ─< projects ─< tasks ─< comments
                                          │           │
                                          │           └─< task_labels >─ labels
                                          │           └─< sub_tasks
                                          └─< invites
notifications, refresh_tokens (Redis), event_outbox, ai_usage are auxiliary.
```

### 10.2 Tables (PostgreSQL DDL — abridged)

```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           CITEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  display_name    VARCHAR(60) NOT NULL,
  avatar_url      TEXT,
  token_version   INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  disabled_at     TIMESTAMPTZ
);

CREATE TABLE workspaces (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(80) NOT NULL,
  slug         VARCHAR(80) UNIQUE NOT NULL,
  timezone     VARCHAR(64) NOT NULL DEFAULT 'UTC',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at  TIMESTAMPTZ
);

CREATE TYPE role AS ENUM ('OWNER','ADMIN','MEMBER','VIEWER');
CREATE TABLE memberships (
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role         role NOT NULL,
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

CREATE TABLE projects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         VARCHAR(120) NOT NULL,
  created_by   UUID NOT NULL REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at  TIMESTAMPTZ
);

CREATE TYPE task_status AS ENUM ('TODO','IN_PROGRESS','BLOCKED','DONE');
CREATE TYPE task_priority AS ENUM ('P0','P1','P2','P3');

CREATE TABLE tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id    UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  status       task_status NOT NULL DEFAULT 'TODO',
  priority     task_priority NOT NULL DEFAULT 'P2',
  assignee_id  UUID REFERENCES users(id),
  due_date     DATE,
  position     DOUBLE PRECISION NOT NULL,        -- fractional ordering for drag-drop
  version      INT NOT NULL DEFAULT 0,           -- optimistic locking
  created_by   UUID NOT NULL REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ
);
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id) WHERE deleted_at IS NULL;

CREATE TABLE comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES users(id),
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE labels (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         VARCHAR(40) NOT NULL,
  color        CHAR(7) NOT NULL,                  -- hex
  UNIQUE (workspace_id, name)
);

CREATE TABLE task_labels (
  task_id  UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, label_id)
);

CREATE TABLE notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         VARCHAR(40) NOT NULL,              -- ASSIGNED, MENTIONED, etc.
  payload      JSONB NOT NULL,
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE event_outbox (
  id           BIGSERIAL PRIMARY KEY,
  topic        VARCHAR(120) NOT NULL,
  payload      JSONB NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);
CREATE INDEX idx_outbox_unpublished ON event_outbox(id) WHERE published_at IS NULL;

CREATE TABLE ai_usage (
  id                BIGSERIAL PRIMARY KEY,
  user_id           UUID NOT NULL,
  feature           VARCHAR(40) NOT NULL,
  prompt_tokens     INT NOT NULL,
  completion_tokens INT NOT NULL,
  cost_cents        NUMERIC(10,4) NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 10.3 Redis Keyspace
```
refresh:{jti}              hash    {userId, hash, exp}                TTL 7d
blacklist:{userId}         set     {jti,...}                          TTL 7d
ratelimit:login:{ip}       counter                                    TTL 15m
cache:tasks:project:{id}   string  JSON payload                       TTL 60s
cache:user:{id}:notifs     string  JSON payload                       TTL 30s
ai:cache:{hash}            string  JSON payload                       TTL 60s
presence:project:{id}      set     {userId,...}                       TTL idle 60s
pubsub channel: tf.events.*  (one per topic)
```

---

## 11. REST API Specification (excerpt)

> Full OpenAPI document is generated by springdoc and served at `/api/v1/openapi.json`.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/v1/auth/signup | Public | FR-1.1 |
| POST | /api/v1/auth/login | Public | FR-1.2 |
| POST | /api/v1/auth/refresh | Refresh cookie | FR-1.3 |
| POST | /api/v1/auth/logout | Refresh cookie | FR-1.4 |
| GET | /api/v1/me | Bearer | Current user |
| GET | /api/v1/workspaces | Bearer | List my workspaces |
| POST | /api/v1/workspaces | Bearer | FR-2.1 |
| POST | /api/v1/workspaces/{id}/invites | Bearer (Admin+) | FR-2.2 |
| GET | /api/v1/projects/{id}/tasks | Bearer | Cached read |
| POST | /api/v1/projects/{id}/tasks | Bearer | FR-3.1 |
| PATCH | /api/v1/tasks/{id} | Bearer | FR-3.2 (with `If-Match: <version>`) |
| DELETE | /api/v1/tasks/{id} | Bearer | FR-3.3 |
| POST | /api/v1/tasks/{id}/comments | Bearer | Add comment |
| POST | /api/v1/ai/projects/{id}/suggest | Bearer | FR-5.1 |
| POST | /api/v1/ai/projects/{id}/prioritise | Bearer | FR-5.2 (returns proposal; client confirms) |
| POST | /api/v1/ai/parse-task | Bearer | FR-5.3 |
| GET | /api/v1/me/notifications | Bearer | Paged list |

**Common contract**
- All responses are `application/json; charset=utf-8`.
- Error envelope: `{ "code": "TASK_NOT_FOUND", "message": "...", "details": {...} }`.
- Pagination: cursor-based (`?cursor=...&limit=50`, max 100).
- Standard headers: `X-Request-Id`, `X-RateLimit-Remaining`.

---

## 12. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend framework | Next.js 14 (App Router) | SSR for marketing pages, SPA for app |
| Language (FE) | TypeScript 5 | Type safety end-to-end |
| State / data fetching | SWR + zod | Cache-friendly + runtime validation |
| Styling | Tailwind CSS + shadcn/ui | Fast iteration, accessible primitives |
| Real-time client | @stomp/stompjs | Matches Spring STOMP server |
| Backend framework | Spring Boot 3.3 (Java 21) | Mature, batteries-included |
| AI | Spring AI 1.x + OpenAI Chat | Provider-agnostic abstraction |
| Persistence | PostgreSQL 15, Spring Data JPA + Flyway | Relational integrity + migrations |
| Cache / pub-sub | Redis 7 | Token store + cache + WebSocket fan-out |
| Build (BE) | Gradle | Conventional |
| Build (FE) | pnpm | Fast, disk-efficient |
| Testing (BE) | JUnit 5, Testcontainers, RestAssured | Real DB in tests |
| Testing (FE) | Vitest + Playwright | Unit + e2e |
| Observability | OpenTelemetry, Prometheus, Loki | Standard cloud-native |
| CI/CD | GitHub Actions | PR checks + container build |
| Container | Distroless JRE 21 | Minimal attack surface |

---

## 13. Module Breakdown (Backend Packages)

```
com.taskflow
├─ TaskflowApplication.java
├─ config
│   ├─ SecurityConfig.java          // JWT filter chain
│   ├─ WebSocketConfig.java         // STOMP endpoints + Redis relay
│   ├─ RedisConfig.java             // Lettuce + RedisTemplate beans
│   ├─ OpenAiConfig.java            // Spring AI ChatClient
│   └─ FlywayConfig.java
├─ auth
│   ├─ AuthController, AuthService, JwtService, RefreshTokenService
├─ user        (CRUD profile)
├─ workspace   (workspaces, memberships, invites)
├─ project
├─ task
│   ├─ TaskController, TaskService, TaskRepository
│   ├─ TaskEvent.java               // outbox payload
├─ comment
├─ notification
├─ ai
│   ├─ AiController
│   ├─ TaskSuggestionService, BacklogPrioritiserService, NlpTaskParser
│   ├─ prompt/SuggestTasksPrompt.java
│   └─ schema/TaskSuggestion.java   // structured-output target
├─ realtime
│   ├─ EventOutboxPublisher (scheduler)
│   ├─ PresenceService
│   └─ WebSocketAuthInterceptor
├─ cache
│   ├─ ReadThroughCache<T>
│   └─ CacheInvalidator
└─ common
    ├─ error (GlobalExceptionHandler)
    ├─ pagination, security utils
```

---

## 14. Implementation Phases

### Phase 0 — Foundations (Week 1)
- Repos created, CI green, base Spring Boot + Next.js skeletons running.
- Postgres + Redis docker-compose for local.
- Healthcheck endpoints, structured logging, base error envelope.

### Phase 1 — Auth & Workspaces (Week 2)
- FR-1.1 to FR-1.4, FR-2.1, FR-2.2.
- Refresh-token rotation + Redis blacklist.
- Frontend login/signup flow.

### Phase 2 — Tasks CRUD (Weeks 3–4)
- FR-3.1 to FR-3.3, FR-3.5 (sub-tasks).
- Optimistic concurrency, fractional positions for drag-drop.
- Read-through cache for project task lists.

### Phase 3 — Real-time (Week 5)
- WebSocket + STOMP, Redis pub/sub fan-out.
- Outbox publisher scheduler.
- Frontend live updates and presence avatars.

### Phase 4 — AI (Weeks 6–7)
- Spring AI integration, structured-output schemas, prompt templates v1.
- FR-5.1 (suggest), FR-5.3 (parse). Frontend "AI" panel.
- AI usage logging + cost dashboard.

### Phase 5 — Notifications + Polish (Week 8)
- FR-6.1 in-app, email digest job.
- A11y pass, dark mode, empty states, error recovery toasts.
- Load test, security review, fixes.

### Phase 6 — v1.0 GA (Week 9)
- Stabilisation, production deploy, monitoring, runbook.

---

## 15. Acceptance Criteria (Sample, P1)

| FR | Acceptance Test |
|---|---|
| FR-1.1 | New email + valid password → 201 with token pair; weak password → 400 with field error. |
| FR-1.2 | 5 wrong attempts → 6th returns 429 with `Retry-After`. |
| FR-1.3 | Reusing a rotated `jti` → 401 + ALL refresh tokens for that user become invalid (verify by attempting refresh from another session). |
| FR-3.1 | Two clients subscribed to same project: client A creates a task → client B receives event with the new task within 250 ms (P95 over 100 trials). |
| FR-3.2 | Concurrent PATCH from two clients with same `If-Match` → exactly one succeeds (200), the other gets 409 with current version. |
| FR-5.1 | Calling /suggest twice within 60 s with identical context returns cached response (verified via response header `X-Cache: HIT`). |
| FR-5.2 | Returned task IDs are a strict subset of input IDs; mutation is not applied until client `confirm` call. |
| NFR-2 | k6 load test, 500 concurrent users, P95 WS latency < 250 ms. |
| NFR-4 | After 30-min steady-state, Redis `keyspace_hits / (hits+misses)` ≥ 60 %. |

---

## 16. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| OpenAI outage or quota | Med | High | Feature flag to disable AI per workspace; cache last responses; circuit breaker. |
| LLM cost overrun | Med | Med | Per-user daily token budget; alerts at 80 %; downgrade model. |
| WebSocket fan-out at scale | Low | High | Stress-test early; Redis cluster; consider Centrifugo if needed. |
| Refresh token theft | Low | High | Rotation + reuse-detection (token-version bump); HTTP-only Secure SameSite=Strict cookie. |
| Cache stampede on hot project | Med | Med | Single-flight (`SETNX` lock) around cache fill. |
| Optimistic concurrency UX confusion | Med | Low | Toast with diff + "use mine / use theirs" choice. |
| AI response schema drift | Low | Med | Strict JSON-schema validation; reject and retry once with stricter prompt. |

---

## 17. Glossary

| Term | Meaning |
|---|---|
| STOMP | Simple/Streaming Text Oriented Messaging Protocol — the message protocol used over WebSocket. |
| jti | JWT ID — unique identifier per token, used for revocation. |
| Outbox pattern | Insert events into a DB table inside the same transaction as the state change; a separate publisher reads and forwards — gives at-least-once delivery without dual-write inconsistency. |
| Read-through cache | Cache layer that, on miss, loads from the source and stores the result automatically. |
| Token rotation | Issuing a new refresh token on every refresh and invalidating the old one. |
| Fractional position | A double-precision ordering value that lets us insert between two items without renumbering. |

---

## 18. Appendix A — Sample AI Prompt (v1, Suggest Tasks)

```
SYSTEM:
You are a task-planning assistant. Given a project's recent tasks, propose 5 concrete next tasks.
Return ONLY JSON matching this schema:
{
  "suggestions": [
    {"title": string (≤120 chars),
     "description": string (≤400 chars),
     "suggestedPriority": "P0" | "P1" | "P2" | "P3"}
  ]
}
Rules:
- Do NOT repeat existing tasks.
- Do NOT include placeholder text.
- Titles must be imperative ("Add login throttling") not declarative.

USER:
Project: {{project.name}}
Workspace timezone: {{workspace.timezone}}
Recent tasks (most recent first):
{{#each recentTasks}}
- [{{this.status}}] [{{this.priority}}] {{this.title}}
{{/each}}
```

## 19. Appendix B — Sample AI Prompt (v1, Parse Natural-language Task)

```
SYSTEM:
Parse the user's sentence into a task. Return ONLY JSON:
{ "title": string,
  "assigneeHint": string|null,
  "dueDate": string|null,        // ISO 8601 in workspace timezone
  "durationMinutes": number|null,
  "priority": "P0"|"P1"|"P2"|"P3"|null }
Resolve relative dates ("Friday", "tomorrow 3pm") relative to {{now}} in {{workspace.timezone}}.
If you are < 70% confident on assignee, leave it null.

USER:
{{sentence}}
```

---

*End of document.*
