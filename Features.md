# 🎓 Campus Connect — Complete Project Documentation

> A deep, end‑to‑end explanation of how **Campus Connect** works: its purpose, architecture, technology stack, data model, request flows, security model, and DevOps pipeline.
>
> Source repository: [`Nikhil-Singhal04/Campus_Connect`](https://github.com/Nikhil-Singhal04/Campus_Connect)
> Author: **Nikhil Singhal** · License: **MIT**

---

## 1. What Campus Connect Is

Campus Connect is a **full‑stack campus engagement platform** for a college. It brings the activities that are usually scattered across notice boards, WhatsApp groups, and email chains into one web application:

- Students discover and **register for campus events**.
- Organizers **create events** and manage their registrations.
- Everyone participates in **ConnectX**, a campus‑wide social feed (posts, likes, comments, replies).
- Members **join clubs** and chat inside **event discussion threads**.
- An **AI assistant** (Google Gemini) answers questions about the platform and live event data.
- An **admin / developer console** moderates everything: approving events, handling deletion requests, managing users, replying to contact messages, and viewing platform statistics.

The product is built around **three roles** — **Student**, **Organizer**, and **Admin** — each with a tailored set of screens and permissions.

---

## 2. Feature Set at a Glance

| Area | Capabilities |
|---|---|
| **Auth** | Email + password sign‑up with **OTP email verification**, JWT sessions, role‑based access |
| **Events** | Create, edit (with admin re‑approval), request deletion, list & filter by department/type, view detail |
| **Registrations** | Register for events, view "my registrations", cancel, organizer view of attendees |
| **Payments** | Paid‑event registration flow (currently a **mock/stub** payment intent — Stripe‑ready) |
| **ConnectX feed** | Create posts (text + image), like (one per user), comment, reply‑to‑post |
| **Clubs** | Browse clubs, join, see joined clubs; **event‑specific clubs** auto‑created on approval |
| **Event threads** | Per‑event discussion message board |
| **AI chatbot** | Gemini‑powered assistant grounded in live, approved event data |
| **Admin console** | Approve events / deletions, list users, registrations, contact messages + replies, dashboard stats |
| **Contact** | Public contact form with email delivery (SendGrid) and admin reply |

---

## 3. High‑Level Architecture

Campus Connect is a **classic decoupled web app**: a static multi‑page React frontend talks to a single Node/Express JSON API, which persists everything in PostgreSQL.

```
┌──────────────────────────────┐        HTTPS / JSON         ┌──────────────────────────────┐
│        FRONTEND (static)     │  ───────────────────────▶   │       BACKEND (Express API)   │
│                              │                             │                               │
│  Multi-page React 18 app     │   fetch() via apiService.js │  server.js (monolith)         │
│  • index/signup, signin      │ ◀───────────────────────    │  + routers: chat, connectx,   │
│  • dashboard, event-register │     JWT Bearer tokens       │    event-threads, clubs       │
│  • connectx, clubs, profile  │                             │  + middleware: sessionAuth    │
│  • organiser, admin, payment │                             │  + services: gemini, notify   │
│                              │                             │                               │
│  Tailwind (CDN) + Babel(CDN) │                             │       │ pg (node-postgres)     │
└──────────────────────────────┘                             └───────┼───────────────────────┘
        │ served from S3 + CloudFront (prod)                          ▼
        │ or via Express static routes (local)              ┌──────────────────────────────┐
        ▼                                                   │   PostgreSQL 15               │
   AWS CloudFront                                           │   (Docker / AWS-hosted)       │
                                                            └──────────────────────────────┘

External services: Resend (OTP email) · SendGrid (contact email) · Google Gemini (AI chat)
DevOps: Docker · docker-compose · Jenkins CI/CD · AWS ECR/ECS (backend) · S3/CloudFront (frontend) · Terraform (IaC)
```

**Key architectural facts:**

- The frontend has **no build step**. Each HTML page loads React, ReactDOM, Babel‑standalone, Tailwind, and the page's `.jsx` directly from CDNs, then transpiles JSX in the browser. This keeps the frontend a folder of static files that S3 can serve as‑is.
- The backend is a **single Express application** (`server.js`, ~2,200 lines) that handles most routes inline, with four feature areas extracted into separate router modules.
- The roles are **not** separate apps — they are the same API plus role‑aware frontend pages gated by the user's `accountType` / admin JWT.

---

## 4. Technology Stack (Detailed)

### Frontend
| Tech | Role |
|---|---|
| **React 18** (UMD, via unpkg CDN) | UI component library |
| **Babel Standalone** (CDN) | In‑browser JSX transpilation — no bundler |
| **Tailwind CSS** (CDN play build) | Styling, with a custom theme (`Space Grotesk` + `Manrope` fonts, custom keyframe animations) |
| **Vanilla JS modules** | `apiService.js` (API client), `authContext.js` (auth state), `theme.js` |
| **Multi‑page architecture** | One `.html` + one `.jsx` per screen (no SPA router) |

### Backend
| Tech | Role |
|---|---|
| **Node.js + Express 4** | HTTP server & routing |
| **pg (node‑postgres)** | PostgreSQL driver with a connection `Pool` |
| **bcryptjs** | Password hashing (cost factor 12) |
| **jsonwebtoken (JWT)** | Stateless sessions & scoped tokens |
| **express‑rate‑limit** | Per‑route throttling (OTP, auth, admin, contact, global) |
| **crypto** | OTP generation & constant‑time comparisons |
| **dotenv** | Environment configuration |
| **@google/generative-ai** | Gemini chatbot |
| **resend** | Transactional OTP / confirmation emails |
| **@sendgrid/mail** | Contact‑form email delivery |
| **sqlite3** | Legacy — used only by the SQLite→Postgres migration script |

### Database
- **PostgreSQL 15** (alpine in Docker). All timestamps are stored as `BIGINT` epoch‑milliseconds.

### DevOps / Infrastructure
| Tech | Role |
|---|---|
| **Docker + docker‑compose** | Local Postgres + backend containers |
| **Jenkins** | CI/CD pipeline (`Jenkinsfile`) |
| **AWS ECR + ECS** | Backend image registry & container hosting |
| **AWS S3 + CloudFront** | Frontend static hosting & CDN |
| **Terraform** | Infrastructure as Code |
| **Security tooling** | GitLeaks (secrets), Checkov (IaC), npm audit (deps), Semgrep (SAST), Trivy (image scan) |

---

## 5. Frontend Architecture

The frontend lives in `Frontend/` and is a set of **independent pages**. Each page is a pair: a thin `.html` shell that loads CDNs + the page script, and a `.jsx` file that renders the screen into `#root`.

### Page map
| Page (`.html` / `.jsx`) | Purpose | Primary role |
|---|---|---|
| `index` | Account creation (sign‑up + OTP) | public |
| `signin` | Login | public |
| `dashboard` | Browse/register for events, see the feed | Student |
| `event-register` | Event registration form | Student |
| `payment` | Paid‑event checkout (mock) | Student |
| `connectx` | Campus‑wide social feed | all logged‑in |
| `clubs` | Browse & join clubs | all logged‑in |
| `event-discussion` | Per‑event discussion thread | all logged‑in |
| `profile` | View/edit profile | all logged‑in |
| `settings` | Account settings | all logged‑in |
| `organiser` | Organizer dashboard (create/manage events) | Organizer |
| `admin` | Admin console | Admin |

Shared, non‑page scripts:
- **`apiService.js`** — a singleton `CampusConnectAPI` class exposed as `window.campusAPI`. It is the **single source of truth for every backend call**. It resolves the API base URL (localhost → `http://localhost:4000/api`, otherwise `{origin}/api`, with an override hook), stores the JWT and user in `localStorage` (`cc_token`, `cc_user`), and attaches the `Authorization: Bearer` header automatically.
- **`authContext.js`** — a lightweight observable auth store (`window.authContext`) with helpers like `isStudent()`, `isOrganizer()`, `isAdmin()`, `requireAuth()`, and `requireRole()` used by pages to gate access and redirect.
- **`chatbot.jsx`** — the floating Gemini assistant widget mounted on pages.

Because there's no router, **navigation is plain `<a href>` between HTML files**, and auth state is shared through `localStorage`, so every page reads the same token/user.

---

## 6. Backend Architecture

The backend is in `Backend/` and centers on `server.js`. It wires up middleware, mounts feature routers, serves the frontend HTML in local/single‑host deployments, and defines the bulk of the API inline.

### Module breakdown
| File | Responsibility |
|---|---|
| `server.js` | App bootstrap, middleware, CORS, rate limiters, auth/OTP/events/registrations/admin/payments/profile routes |
| `db.js` | PostgreSQL `Pool` + `run/get/all/close` helpers, and a **`?` → `$1` placeholder converter** (legacy SQLite‑style queries work against Postgres) |
| `init-db.js` | Creates all tables & indexes on boot, seeds default clubs, backfills event clubs/memberships |
| `middleware/sessionAuth.js` | `requireSession` / `getSessionPayload` — verifies session‑scoped JWTs |
| `routes/community.js` | ConnectX feed (`/api/connectx`) — posts, likes, comments, replies |
| `routes/clubs.js` | Clubs (`/api/clubs`) — list, joined, join (with alias normalization) |
| `routes/eventThreads.js` | Event discussion (`/api/event-threads`) |
| `routes/chat.js` → `controllers/chatController.js` | AI chat (`/api/chat`) — builds live event context, calls Gemini |
| `services/geminiService.js` | Gemini client, system prompt, primary + fallback model, history normalization |
| `services/notificationService.js` | Registration confirmation emails via Resend |
| `scripts/create_user.js` | CLI helper to seed a user |
| `migrate-sqlite-to-pg.js` | One‑time data migration from an older SQLite database |

### The `db.js` placeholder trick
The project was originally written for SQLite (which uses `?` placeholders). Rather than rewrite every query, `db.js` rewrites `?` into PostgreSQL's `$1, $2, …` on the fly and normalizes the result shape (`lastID`, `changes`, single row, all rows). This is why you'll see SQLite‑style SQL throughout the codebase even though it runs on Postgres.

---

## 7. Database Schema

All tables are created idempotently (`CREATE TABLE IF NOT EXISTS`) by `init-db.js` on every startup, with supporting indexes and `ON DELETE CASCADE` foreign keys.

| Table | Purpose | Notable columns / rules |
|---|---|---|
| `users` | Accounts | `account_type` (Student/Organizer), unique `email` & `username`, `password_hash`, profile fields (reg_no, department, program_or_unit, year_or_designation) |
| `otp_challenges` | Email verification | `code_hash`, `expires_at`, `attempts`, `verified` |
| `events` | Campus events | `approval_status` (Pending/Approved), `event_price`, `max_team_size`, edit/delete request metadata, `organizer_id → users` |
| `event_registrations` | Attendees | unique `(event_id, user_id)`, `pricing_label`, `payment_path` |
| `community_posts` | ConnectX feed | `text`, optional `image`, optional `club`, `like_count`, reply‑to fields |
| `community_post_comments` | Comments on posts | `post_id → community_posts` |
| `community_post_likes` | Like ledger | unique `(post_id, user_id)` enforces one like per user |
| `event_discussion_messages` | Per‑event chat | `event_id → events` |
| `clubs` | Clubs | text PK id; default clubs seeded; **event clubs** use id `event_{eventId}` |
| `club_memberships` | Club join records | unique `(club_id, user_id)` |
| `contact_messages` | Contact form | optional `reply_*` fields when an admin responds |

### Seeding & backfill behavior
On every boot `init-db.js`:
1. Seeds six **default clubs** (Coding, Design & UX, Entrepreneurship, Cultural, Sports, AgriClub).
2. **Backfills event clubs**: for every approved event it creates a club `event_{id}` and auto‑enrolls the organizer plus all registrants. This is why registering for an event drops you into that event's chat group automatically.

---

## 8. Authentication & Security Model

### Sign‑up with OTP (the headline auth flow)
1. **`POST /api/auth/otp/send`** — user enters email; the server generates a 6‑digit code, stores a **hash** of it (peppered via `OTP_PEPPER`) with an expiry, and emails it via **Resend**. In dev (no Resend keys) the code is logged to the console.
2. **`POST /api/auth/otp/verify`** — user submits the code. The server compares hashes, enforces a **3‑attempt limit** with a 30‑minute lockout, marks the challenge verified, and issues a short‑lived **`signup-proof`** JWT (`JWT_SIGNUP_PROOF_EXPIRY`, default 15m).
3. **`POST /api/auth/register`** — the client sends the `signupProofToken` plus profile + password. The server verifies the proof token's scope and matching email, enforces a **strong password policy** (≥8 chars, upper, lower, number, special), checks email/username uniqueness, hashes the password with **bcrypt (cost 12)**, creates the user, and returns a **`session`**‑scoped JWT valid for 7 days.

> OTP can be disabled with `REQUIRE_EMAIL_OTP=false`, in which case registration skips the proof‑token check.

### Tokens & scopes
JWTs are scoped to prevent misuse:
- **`session`** — normal user sessions (7‑day expiry). Verified by `getSessionPayload` / `requireSession`.
- **`signup-proof`** — proves email ownership during registration only (15‑min expiry).
- **admin** — issued by `POST /api/admin/login` when the submitted email/password match `ADMIN_EMAIL`/`ADMIN_PASSWORD` (8‑hour expiry, `role: "admin"`).

### Admin / developer gate (`requireDeveloper`)
Admin endpoints accept **either** an admin‑role JWT **or** a `DEV_ADMIN_KEY` header (constant‑time compared). If neither admin auth method is configured, admin routes return 503.

### Defense‑in‑depth
- **Rate limiting** with `express-rate-limit`, tuned per surface: OTP (8 / 10 min), auth (40 / 10 min), admin (60 / 10 min), contact (12 / 10 min), and a global 250 / 15 min cap.
- **CORS** allow‑list driven by `FRONTEND_ORIGIN`, with explicit allowances for loopback and private‑network origins (handy for LAN testing).
- **Password hashing** with bcrypt; **OTP hashing** with a server‑side pepper.
- **SSL to the database** is enabled automatically in production (`NODE_ENV=production` or a non‑local `DB_HOST`).
- The Jenkins pipeline runs **GitLeaks, Checkov, npm audit, Semgrep, and Trivy** as gates.

---

## 9. Core Workflows

### Event lifecycle
1. An **Organizer** calls `POST /api/events` → event is created with `approval_status = "Pending"`.
2. An **Admin** reviews pending events (`GET /api/admin/events?status=Pending`) and approves via `PATCH /api/admin/events/:id/approve`. Approval also **creates the event's club and enrolls the organizer**.
3. **Editing** an approved event (`PATCH /api/organizer/events/:id`) records an edit summary and can send it back for re‑approval.
4. **Deletion** is request‑based: the organizer files a reason (`/delete-request`), and an admin approves it (`/approve-delete`).
5. Students see only **approved** events via `GET /api/events` (filterable by `department` and `eventType`).

### Registration → auto club enrollment
`POST /api/events/:id/register` creates an `event_registrations` row (unique per user+event), optionally records a payment path for paid events, sends a **Resend confirmation email**, and enrolls the user into the event's `event_{id}` club so they land in the discussion group.

### ConnectX feed
`/api/connectx/posts` lists posts (newest first) with like counts and nested comments aggregated in one pass. Authenticated users create posts (text and/or image, optionally tagged to a club), like posts (the `community_post_likes` unique constraint guarantees one like per user, with a graceful `23505` duplicate‑key fallback), and comment.

### Clubs
`/api/clubs` lists clubs, `/api/clubs/joined` lists the current user's clubs, and `/api/clubs/:id/join` joins one. The router normalizes legacy club id aliases (`entrepreneurship ↔ entre`, `cultural ↔ culture`) so old and new IDs resolve to the same canonical club.

### AI chatbot (Gemini)
`POST /api/chat` pulls **all approved events** from the database, labels each as Past/Upcoming relative to today, and injects them as **real‑time context** into the Gemini system prompt. The assistant is constrained by a strict prompt (bullet‑point answers, no invented features, never expose backend details) and uses a **primary model with an automatic fallback** if the primary is unavailable. This grounds AI answers in live data rather than hallucinations.

### Payments (current state)
`POST /api/payments/create-intent` and `/api/payments/confirm` exist and validate the user/event/registration, but the actual charge is a **mock** — the code returns a synthetic payment intent and marks the registration confirmed, with explicit `TODO: Integrate with Stripe` markers. The plumbing (registration `payment_path`, pricing labels) is in place for a real provider.

### Contact
`POST /api/contact` stores a message and emails it via **SendGrid**; admins read messages and reply through `/api/admin/contact-messages/:id/reply`, which records the reply on the row.

---

## 10. API Reference (Grouped)

> Base path: `/api`. Auth header: `Authorization: Bearer <token>`.

**Auth**
- `POST /auth/otp/send` · `POST /auth/otp/verify` · `POST /auth/register` · `POST /auth/signin` · `GET /auth/me`

**Profile**
- `GET /profile` · `PATCH /profile`

**Events (public/student)**
- `GET /events` (filters: `department`, `eventType`) · `GET /events/:id` · `POST /events/:id/register` · `DELETE /events/:id`

**Registrations (student)**
- `GET /me/registrations` · `DELETE /me/registrations/:id`

**Organizer**
- `POST /events` · `GET /organizer/events` · `PATCH /organizer/events/:id` · `POST /organizer/events/:id/delete-request` · `GET /organizer/events/:id/registrations`

**Payments**
- `POST /payments/create-intent` · `POST /payments/confirm`

**ConnectX**
- `GET /connectx/posts` · `POST /connectx/posts` · `POST /connectx/posts/:id/like` · `POST /connectx/posts/:id/comments`

**Clubs**
- `GET /clubs` · `GET /clubs/joined` · `POST /clubs/:id/join`

**Event threads**
- `GET /event-threads/:id` · `POST /event-threads/:id`

**Chat**
- `POST /chat`

**Contact**
- `POST /contact`

**Admin** (require admin JWT or dev key)
- `POST /admin/login` · `GET /admin/users` · `GET /admin/events` · `PATCH /admin/events/:id/approve` · `GET /admin/events/deletion-requests` · `PATCH /admin/events/:id/approve-delete` · `GET /admin/events/:id/registrations` · `GET /admin/registrations` · `GET /admin/contact-messages` · `POST /admin/contact-messages/:id/reply` · `GET /admin/stats`

**Utility**
- `GET /health` · `GET /config`

---

## 11. DevOps & Deployment

### Local development (Docker)
`docker-compose.yml` defines two services on a shared bridge network:
- **`postgres`** — `postgres:15-alpine`, persisted to a named volume, with a `pg_isready` healthcheck (host port defaults to **5433**).
- **`backend`** — built from `Backend/Dockerfile` (`node:18-alpine`), waits for Postgres to be healthy, and reads all secrets from the environment.

Root `package.json` provides convenience scripts: `start` (Windows PowerShell runner), `start:unix`, `start:background` (`docker-compose up -d`), `stop`, and log tailers.

### CI/CD pipeline (Jenkins)
The `Jenkinsfile` defines a full pipeline:
1. **Checkout** source.
2. **Security scans** — GitLeaks (secrets), Checkov (Terraform), npm audit (dependencies), Semgrep (SAST).
3. **Install dependencies** (backend).
4. **Docker build** of the backend image + **Trivy** image scan.
5. **Push image to AWS ECR** (tagged with build number and `latest`).
6. **Deploy backend** via an ECS rolling update (`aws ecs update-service --force-new-deployment`).
7. **Deploy frontend** by `aws s3 sync` to the S3 bucket and a **CloudFront cache invalidation**.
8. **Notify** a Slack `#deployments` channel on success/failure.

### Production topology
- **Backend**: containerized, stored in **ECR**, run on **ECS**.
- **Frontend**: static files served from **S3** and fronted by **CloudFront**.
- **Infrastructure**: provisioned via **Terraform** (`terraform/`), scanned by Checkov in CI.

---

## 12. Environment Variables

| Variable | Purpose |
|---|---|
| `PORT` | Backend port (default 4000) |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | PostgreSQL connection |
| `JWT_SECRET` | Signs all JWTs (**required**) |
| `JWT_SIGNUP_PROOF_EXPIRY` | Signup‑proof token lifetime (default 15m) |
| `OTP_PEPPER` | Server‑side pepper for OTP hashing (**required**) |
| `OTP_EXPIRY_MINUTES` | OTP validity window (default 10) |
| `REQUIRE_EMAIL_OTP` | Toggle OTP verification on/off |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Admin login credentials (**required**) |
| `DEV_ADMIN_KEY` | Alternative admin access key |
| `FRONTEND_ORIGIN` | CORS allow‑list (comma‑separated) |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `RESEND_AUDIENCE_NAME` | OTP & confirmation email |
| `SENDGRID_API_KEY` / `CONTACT_FROM_EMAIL` / `CONTACT_TO_EMAIL` / `CONTACT_SUBJECT_PREFIX` | Contact‑form email |
| `GEMINI_API_KEY` | Google Gemini AI chatbot |
| `NODE_ENV` | Enables DB SSL in production |

---

## 13. Running the Project Locally

```bash
# 1. Clone
git clone https://github.com/Nikhil-Singhal04/Campus_Connect.git
cd Campus_Connect

# 2. Create a .env (see the variables table above)

# 3. Start everything with Docker
npm run start:background      # docker-compose up -d  (Postgres + backend)

# --- OR run the backend directly ---
cd Backend
npm install
npm start                     # node server.js  (auto-creates tables on boot)
```

The frontend is static — open `Frontend/index.html` through a local server (e.g. VS Code Live Server on port 5500, which is in the default CORS allow‑list) or let the Express server serve the HTML routes directly.

---

## 14. Notable Design Decisions & Observations

- **No frontend build step.** Babel transpiles JSX in the browser and Tailwind runs from the CDN play build. This makes deployment trivial (just sync files to S3) but ships a larger runtime and isn't optimal for production performance.
- **SQLite heritage.** The codebase began on SQLite; `db.js`'s placeholder converter and the `migrate-sqlite-to-pg.js` script are the bridge to PostgreSQL. SQL is still written in SQLite style.
- **Epoch‑millisecond timestamps** (`BIGINT`) everywhere instead of native `TIMESTAMP`, keeping date handling consistent across the JS layers.
- **Event clubs are derived data**, reconstructed/backfilled on every boot — a resilient pattern that self‑heals missing memberships.
- **Payments are stubbed.** The flow, schema, and endpoints exist, but real charging (Stripe/Razorpay) is a clearly marked TODO.
- **Security is taken seriously** in the pipeline (five scanners) and at runtime (scoped JWTs, peppered OTP hashes, bcrypt, per‑route rate limits, constant‑time admin‑key comparison).

---

## 15. Future Enhancements (from the project roadmap)

- 📱 Native mobile application
- 🤖 AI‑based event recommendations
- 🎥 Video‑calling integration
- 📅 Richer event‑management tooling
- 🧠 Smart notifications
- ☁️ Broader cloud deployment

---

*This document was produced by reading the Campus Connect source code — the backend (`server.js`, routers, services, `init-db.js`, `db.js`), the frontend (`apiService.js`, `authContext.js`, page shells), and the infrastructure files (`docker-compose.yml`, `Backend/Dockerfile`, `Jenkinsfile`). It reflects the as‑built behavior of the repository.*
