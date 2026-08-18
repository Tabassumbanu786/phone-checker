# Phone Number Availability Checker

Checks whether a phone number already exists in a `users` table — via a
React web page and a Zoho SalesIQ chatbot, both backed by the same Express
API and Neon Postgres database.

There is intentionally **no way to insert or register a phone number**
through the app. Test rows are inserted directly in Neon via
[`db/seed_test_row.sql`](./db/seed_test_row.sql).

**Live demo:** https://phone-checker-brown.vercel.app (API: https://phone-checker-qdre.vercel.app)

## Stack

- **Frontend:** React + TypeScript (Vite)
- **Backend:** Node.js + Express + TypeScript
- **Database:** Neon (serverless Postgres)
- **Chat:** Zoho SalesIQ (SalesIQ Scripts / Zobot)

## Repo structure

```
backend/            Express API (TypeScript)
  src/
    app.ts           Express app (exported for tests)
    server.ts         Entry point
    routes/phone.ts    POST /api/phone/check
    lib/phone.ts        Normalization + validation
    lib/db.ts            Postgres pool
    middleware/           Rate limiting, error handling
    __tests__/             Jest + Supertest tests
frontend/            React + TS page (Vite)
  src/App.tsx           The Check UI
zoho-salesiq/        Zobot Deluge script + setup guide
db/                 schema.sql and the manual seed script
```

## How it works

1. User (web page or SalesIQ chat) submits a phone number.
2. The API normalizes it to E.164 (`+14155552671`) using `libphonenumber-js`,
   which handles spaces, hyphens, parentheses, `00` international prefixes,
   and numbers missing a country code (falls back to `DEFAULT_COUNTRY_CODE`).
3. It looks up the normalized number in `users.phone_number` (unique index).
4. Returns `"Phone number already exists"` or `"Good to go"`.

## Local setup

Prerequisites: Node 18+, a Neon database (or any Postgres).

### 1. Database

```bash
psql "$DATABASE_URL" -f db/schema.sql
psql "$DATABASE_URL" -f db/seed_test_row.sql   # inserts +14155552671 and +917021710954
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # fill in DATABASE_URL
npm install
npm run dev             # http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env   # VITE_API_BASE_URL, defaults to http://localhost:4000
npm install
npm run dev              # http://localhost:5173
```

Open http://localhost:5173, enter `415-555-2671` (the seeded row) and one you
made up — you should see "Phone number already exists" and "Good to go"
respectively.

### 4. Zoho SalesIQ

See [`zoho-salesiq/README.md`](./zoho-salesiq/README.md).

## API

### `POST /api/phone/check`

Request:
```json
{ "phoneNumber": "415-555-2671" }
```

Response `200`:
```json
{ "exists": true, "normalized": "+14155552671", "message": "Phone number already exists" }
```

Response `400` (empty/invalid input):
```json
{ "error": "Phone number is not a valid phone number." }
```

Response `429`: rate limit exceeded (`RATE_LIMIT_PER_MINUTE`, default 20/min per IP).

### `GET /health`

Liveness check, returns `{ "status": "ok" }`.

## Database schema

```sql
CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    phone_number  TEXT NOT NULL UNIQUE, -- normalized E.164, e.g. +14155552671
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Full definition in [`db/schema.sql`](./db/schema.sql).

## Tests

```bash
cd backend
npm test
```

20 Jest/Supertest tests covering: phone normalization (hyphens, spaces,
parens, `00` prefix, E.164 passthrough, equivalence of differently-formatted
duplicates), empty/missing/invalid input (400s), exists/not-exists lookups
(mocked DB), a simulated DB failure (500 with a generic message, no leaked
internals), rate limiting (429 past the per-minute cap), 404 on unknown
routes, and the health check.

## Error handling & security

- All input is validated and normalized before it touches the database
  (parameterized query — no SQL injection surface).
- Unhandled errors return a generic `500` — no stack traces or DB errors are
  ever sent to the client (they're logged server-side only).
- `express-rate-limit` caps `/api/phone/check` per IP per minute.
- `helmet` sets standard security headers; CORS is restricted to
  `CORS_ORIGIN`.
- Credentials only ever live in `.env` files (gitignored) — see
  `backend/.env.example` and `frontend/.env.example`.

## Deployment

The Neon database is already live (created for this project). Both apps
deploy to **Vercel**, as two separate projects from this one GitHub repo
(one rooted at `backend`, one at `frontend`).

**Backend:**
1. Push this repo to GitHub.
2. In Vercel: New Project > import the repo > set **Root Directory** to
   `backend`.
3. It deploys as a serverless function ([`backend/api/index.ts`](./backend/api/index.ts)
   wraps the same Express app; [`backend/vercel.json`](./backend/vercel.json)
   routes all paths to it).
4. Add env vars in the Vercel project's Settings > Environment Variables:
   - `DATABASE_URL` — use Neon's **pooled** connection string (the `-pooler`
     host) since serverless functions open a fresh connection per
     invocation.
   - `CORS_ORIGIN` — your frontend's Vercel URL (can start as `*` and be
     tightened after the frontend is deployed).
5. Deploy. Note the resulting URL, e.g. `https://phone-checker-api.vercel.app`.

**Frontend:**
1. In Vercel: New Project > import the same repo again > set **Root
   Directory** to `frontend`.
2. Add env var `VITE_API_BASE_URL` = your backend's Vercel URL from above.
3. Deploy — [`frontend/vercel.json`](./frontend/vercel.json) configures the
   build.
4. Go back to the backend project's `CORS_ORIGIN` env var and set it to this
   frontend URL, then redeploy the backend.

**Zoho SalesIQ:** update the `apiUrl` in
[`zoho-salesiq/zobot-message-handler.dg`](./zoho-salesiq/zobot-message-handler.dg)
to the deployed backend URL once it's live, then re-save/publish the Zobot.

## Deliverables checklist

- [x] Neon database with `users` table
- [x] One test phone number inserted manually (`db/seed_test_row.sql`, not via the app)
- [x] `POST /api/phone/check` API
- [x] React page (enter number, Check, see result)
- [x] Zoho SalesIQ flow (same API, same result)
- [x] Phone normalization (spaces/hyphens/country codes)
- [x] Input validation (empty/invalid)
- [x] Error handling + rate limiting
- [x] Automated API tests (20 tests, `backend/npm test`)
- [x] Credentials in env vars (`.env.example` for both apps)
- [x] Deployed demo — frontend: https://phone-checker-brown.vercel.app, backend: https://phone-checker-qdre.vercel.app
- [ ] Demonstration video — record a short screen capture of the deployed app
