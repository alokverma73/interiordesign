# Aetherlume — Interior Design Studio Platform

A production-oriented platform for an interior design business: a premium public
website, a customer project portal, and an admin back office with role-based
access control.

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion
- **Backend:** FastAPI + SQLAlchemy 2.0 + PostgreSQL + Pydantic v2
- **Auth:** JWT access/refresh tokens, bcrypt password hashing, separate customer and staff logins
- **Infra:** Docker + docker-compose, Alembic migrations, seed data

---

## Read this first

This codebase was generated in one pass and has been **syntax-checked but not
run against a live database**. Before treating it as production-ready:

1. Run it locally with Docker (steps below) and click through every flow.
2. Expect to fix a handful of small integration issues on first boot — that is
   normal for a codebase of this size that hasn't had a runtime loop yet.
3. Have the security-sensitive parts (auth, file access control, RBAC) reviewed
   before handling real customer data.
4. Replace the placeholder Privacy Policy and Terms with legally reviewed text.

---

## Quick start (Docker — recommended)

```bash
# 1. Configure environment
cp .env.example .env

# 2. Generate two different secrets and paste them into .env
python3 -c "import secrets; print(secrets.token_urlsafe(64))"   # JWT_SECRET_KEY
python3 -c "import secrets; print(secrets.token_urlsafe(64))"   # JWT_REFRESH_SECRET_KEY

# Also set a strong POSTGRES_PASSWORD and update DATABASE_URL to match.

# 3. Build and start everything
docker compose up --build
```

This starts PostgreSQL, runs migrations, seeds demo data, and serves:

| Service    | URL                            |
|------------|--------------------------------|
| Website    | http://localhost:5173          |
| Admin      | http://localhost:5173/admin/login |
| API        | http://localhost:8000          |
| API docs   | http://localhost:8000/api/docs |

---

## Manual setup (without Docker)

### Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL 14+

### 1. Database

```bash
createdb aetherlume_db
createuser aetherlume --pwprompt
psql -c "GRANT ALL PRIVILEGES ON DATABASE aetherlume_db TO aetherlume;"
```

### 2. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy the root .env into backend/, or export the variables.
# DATABASE_URL must point at localhost, not the docker "db" host:
#   postgresql://aetherlume:PASSWORD@localhost:5432/aetherlume_db
cp ../.env .env

# Create the initial migration (first time only), then apply it
alembic revision --autogenerate -m "initial schema"
alembic upgrade head

# Seed roles, permissions and demo content
python -m seed.seed_data

# Run
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install

echo "VITE_API_BASE_URL=http://localhost:8000/api/v1" > .env.local

npm run dev        # dev server on http://localhost:5173
npm run build      # production build into dist/
npm run preview    # preview the production build
```

---

## Demo credentials

Created by the seed script. **Change or delete these before going live.**

| Role      | Email                        | Password      | Signs in at      |
|-----------|------------------------------|---------------|------------------|
| Super Admin | admin@aetherlume.demo      | DemoPass123!  | `/admin/login`   |
| Designer  | designer@aetherlume.demo     | DemoPass123!  | `/admin/login`   |
| Project Manager | pm@aetherlume.demo     | DemoPass123!  | `/admin/login`   |
| Customer  | customer@aetherlume.demo     | DemoPass123!  | `/login`         |

The demo customer has an active project with a populated milestone timeline,
so the client portal isn't empty on first look.

---

## Project structure

```
project-root/
├── backend/
│   ├── app/
│   │   ├── api/          # Route handlers (public, customer portal, admin)
│   │   ├── models/       # SQLAlchemy ORM models
│   │   ├── schemas/      # Pydantic request/response schemas
│   │   ├── auth/         # JWT, password hashing, RBAC dependencies
│   │   ├── middleware/   # Error handlers, rate limiting
│   │   ├── utils/        # File storage, email, pagination, ID generation
│   │   ├── config/       # Settings, database session
│   │   └── main.py       # App factory + router wiring
│   ├── migrations/       # Alembic
│   ├── seed/             # Demo data
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/        # Public website pages
│   │   ├── dashboard/    # Customer portal
│   │   ├── admin/        # Admin panel modules + UI primitives
│   │   ├── layouts/      # Public / dashboard / admin shells
│   │   ├── components/   # Navbar, Footer, Reveal, guards, sliders
│   │   ├── api/          # Axios client with token refresh
│   │   ├── contexts/     # Auth store (Zustand)
│   │   └── types/        # Shared TypeScript types
│   ├── public/           # robots.txt, sitemap.xml
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## API overview

Interactive docs at `/api/docs` (Swagger) and `/api/redoc`.
All routes are prefixed `/api/v1`.

### Public
| Method | Path | Purpose |
|---|---|---|
| GET | `/services` | List active services |
| GET | `/services/{slug}` | Service detail |
| GET | `/projects` | Portfolio, paginated + filterable (`category`, `search`, `featured`) |
| GET | `/projects/{slug}` | Project detail |
| GET | `/projects/{slug}/related` | Related projects |
| GET | `/gallery` | Gallery images |
| GET | `/testimonials` | Published testimonials |
| GET | `/blog`, `/blog/{slug}` | Design journal |
| GET | `/faqs` | Published FAQs |
| GET | `/settings` | CMS content (hero copy, company info, stats) |
| POST | `/quote` | Submit an enquiry, returns an enquiry number |
| GET | `/quote/track/{number}?email=` | Track an enquiry (number + email required) |
| POST | `/contact` | Contact form |
| POST | `/appointments` | Book a consultation slot |
| POST | `/uploads/public` | Upload reference files for a quote |

### Authentication
| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/register` | Create a customer account |
| POST | `/auth/login` | Customer login |
| POST | `/auth/admin/login` | **Separate** staff login |
| POST | `/auth/refresh` | Exchange a refresh token |
| POST | `/auth/verify-email` | Verify email with token |
| POST | `/auth/forgot-password` / `/auth/reset-password` | Password reset |
| GET/PUT | `/auth/me` | Read/update own profile |
| POST | `/auth/change-password` | Change password |

### Customer portal (requires customer token)
| Method | Path | Purpose |
|---|---|---|
| GET | `/dashboard/projects` | My projects |
| GET | `/dashboard/projects/{id}` | Project detail + milestone timeline |
| GET/POST | `/dashboard/projects/{id}/documents` | List / upload documents |
| GET | `/dashboard/documents/{id}/download` | Protected download |
| GET | `/dashboard/projects/{id}/proposals` | Design proposals |
| POST | `/dashboard/projects/{id}/proposals/{pid}/decision` | Approve / request changes |
| GET/POST | `/dashboard/projects/{id}/messages` | Project conversation |
| GET | `/dashboard/enquiries` | My enquiries |
| GET | `/notifications`, `/notifications/unread-count` | In-app notifications |

### Admin (requires staff token + permission)
`/admin/dashboard/summary`, `/admin/enquiries`, `/admin/projects`,
`/admin/services`, `/admin/appointments`, `/admin/testimonials`,
`/admin/blog`, `/admin/faqs`, `/admin/gallery`, `/admin/contact-messages`,
`/admin/users/customers`, `/admin/users/staff`, `/admin/settings`.

### Error format
Every error returns the same shape:
```json
{ "error": { "message": "Human readable message", "code": 404 } }
```
Validation errors add a `fields` array. Unhandled 500s include a `reference`
id that matches a server log entry — the stack trace is never sent to the client.

---

## Roles and permissions

| Role | Permissions |
|---|---|
| `SUPER_ADMIN` | Everything (bypasses permission checks) |
| `ADMIN` | All named permissions |
| `PROJECT_MANAGER` | projects, enquiries, appointments, documents, customers |
| `DESIGNER` | projects, documents |
| `CONTENT_MANAGER` | content, settings |

Permission codes: `services.manage`, `projects.manage`, `enquiries.manage`,
`appointments.manage`, `content.manage`, `settings.manage`, `users.manage`,
`customers.manage`, `documents.manage`.

---

## Security notes

- Passwords are hashed with bcrypt; plaintext is never stored or logged.
- Access tokens (30 min) and refresh tokens (7 days) are signed with **separate** secrets.
- Customer and staff logins are separate endpoints; a customer token cannot reach `/admin/*`.
- Project documents are ownership-checked on every read: a customer can only
  fetch files belonging to their own project.
- Uploaded files get UUID filenames; the original name is stored for display only.
  Extension and size are validated against `ALLOWED_UPLOAD_EXTENSIONS` and
  `MAX_UPLOAD_SIZE_MB`.
- Login, admin login and password reset are rate-limited to 5 requests/minute per IP.
- `/auth/forgot-password` always returns the same response, so it can't be used
  to discover which emails are registered.
- SQL injection is prevented by SQLAlchemy's parameterized queries; React escapes
  output by default (no `dangerouslySetInnerHTML` anywhere in this codebase).

### Before going live
- [ ] Replace all secrets in `.env`; never commit it
- [ ] Set `ENV=production` and `DEBUG=false`
- [ ] Restrict `CORS_ORIGINS` to your real domain only
- [ ] Delete or change every demo account
- [ ] Put the app behind HTTPS
- [ ] Configure a real `EMAIL_BACKEND` (console mode only logs)
- [ ] Set up database backups

---

## Deploying to a VPS (Ubuntu)

```bash
# 1. Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker

# 2. Get the code
git clone <your-repo> /opt/aetherlume
cd /opt/aetherlume

# 3. Configure production environment
cp .env.example .env
nano .env
#   ENV=production
#   DEBUG=false
#   CORS_ORIGINS=https://yourdomain.com
#   FRONTEND_URL=https://yourdomain.com
#   VITE_API_BASE_URL=https://yourdomain.com/api/v1
#   strong POSTGRES_PASSWORD + matching DATABASE_URL
#   fresh JWT secrets

# 4. Start
docker compose up -d --build
```

### Nginx reverse proxy + TLS

```nginx
server {
    server_name yourdomain.com;
    client_max_body_size 30M;

    location /api/ { proxy_pass http://localhost:8000; proxy_set_header Host $host; }
    location /media/ { proxy_pass http://localhost:8000; }
    location / { proxy_pass http://localhost:5173; proxy_set_header Host $host; }
}
```

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Operations

```bash
docker compose logs -f backend            # logs
docker compose exec backend alembic upgrade head    # migrations
docker compose exec db pg_dump -U aetherlume aetherlume_db > backup.sql   # backup
docker compose down && git pull && docker compose up -d --build           # deploy update
```

**Remove the seed step from `docker-compose.yml` after first boot** — it's
idempotent, but you don't want demo accounts recreated in production.

---

## Storage and email backends

Both are abstracted so you swap them via environment variables only.

**Storage:** `STORAGE_BACKEND=local` (default) writes to `LOCAL_STORAGE_PATH`.
Set `STORAGE_BACKEND=s3` plus the `S3_*` variables for AWS S3, MinIO or
DigitalOcean Spaces (`pip install boto3` first). S3 downloads use short-lived
presigned URLs.

**Email:** `EMAIL_BACKEND=console` (default) logs emails to stdout — good for
development. Switch to `smtp` or `sendgrid` with the matching credentials.

---

## What's implemented vs. what isn't

**Implemented and wired end to end:**
public website (all 17 routes), customer auth, customer project portal with
milestone timeline, versioned design proposals with approve/request-changes,
per-project messaging, in-app notifications, secure document upload/download
with ownership checks, multi-step quote form with file attachments and enquiry
tracking, appointment booking, admin panel with dashboard stats and CRUD for
enquiries, projects, services, customers, appointments, testimonials, blog,
gallery, FAQs, contact messages, staff accounts and CMS settings.

**Not implemented — you'll need to add these:**
- Quotation PDF generation (the `Quote` model and admin fields exist; there's no
  PDF renderer or admin UI for building line items yet)
- Appointment slot-availability endpoint (business hours and blocked dates are
  modelled; the booking form offers fixed slots rather than querying availability)
- Blog category management UI (categories exist in the DB and seed data)
- Project milestone editing from the admin UI (milestones are seeded and shown
  to customers; there's no admin CRUD screen for them yet)
- Per-service gallery/features/FAQ editing in the admin UI (the fields exist on
  the model and API; the admin form covers the core fields only)
- Automated tests

---

## License

Provided as-is for your own use. Review and test before production deployment.

---

## Optimization & testing layer

Added after the initial build.

### End-to-end tests (Playwright)

```bash
cd frontend
npm install
npx playwright install --with-deps chromium    # one-time browser download

npm run test:e2e          # run everything (starts the dev server automatically)
npm run test:e2e:ui       # interactive runner
npm run test:e2e:report   # open the last HTML report
```

Two suites, run against Chromium and a mobile viewport:

- `e2e/public-site.spec.ts` — every public route renders with a heading and no
  console errors, unknown routes hit the 404 page, every navbar and footer link
  resolves (no dead links), hero CTAs navigate correctly, portfolio filter and
  search settle into either results or an explicit empty state, images have alt
  text, and the mobile menu opens.
- `e2e/app-flows.spec.ts` — customer and admin login, bad credentials rejected
  cleanly, guards redirect anonymous visitors, **a customer token cannot reach
  the admin panel**, **a customer cannot read another customer's project via
  the API** (asserts 403/404), the full multi-step quote flow including
  validation and enquiry-number generation, every admin route loads, and two
  round-trip tests proving admin edits reach the public site (create a service →
  it appears on `/services`; change `hero_headline` → the homepage `h1` changes).

Against a deployed environment: `E2E_BASE_URL=https://yourdomain.com npm run test:e2e`.

### SEO

`src/components/Seo.tsx` sets per-route title, meta description, Open Graph and
Twitter tags, canonical URL and JSON-LD structured data, and is wired into every
public page. Schema builders cover `InteriorDesignBusiness`, `Service`,
`CreativeWork`, `Article`, `FAQPage` and `BreadcrumbList`. The dashboard and
admin layouts emit `noindex, nofollow`.

This is client-side, so JS-executing crawlers (Google, Bing) see it. Link-preview
bots that don't run JS won't — put the app behind a prerender service or move to
SSR if social previews matter.

### Performance

- **Vendor chunk splitting** — React, Router, Framer Motion, icons and data
  libraries split into separate cached bundles, so a page change doesn't
  re-download the framework.
- **Composite database indexes** matched to the actual query patterns:
  `(is_published, is_deleted, category)` for the portfolio,
  `(status, created_at)` for the admin enquiry list,
  `(enquiry_number, email)` for public tracking,
  `(appointment_date, time_slot_start, status)` for slot-clash detection,
  `(user_id, is_read, created_at)` for the notification badge.
- **N+1 queries eliminated** — `selectinload`/`joinedload` on the project portal
  (milestones, members), design proposals (approvals), messages (conversation),
  and critically on `get_current_user`, which previously fired two extra queries
  for role and permissions on *every authenticated request*.
- **Gzip compression** on API responses over 1 KB; nginx gzip for static assets.
- **Cache policy** — hashed build assets `immutable` for a year, `index.html`
  never cached (otherwise users get a stale app shell after deploys).
- **`src/components/Image.tsx`** — native lazy loading, reserved aspect ratio to
  prevent layout shift, opacity-only fade-in, and a graceful fallback when an
  image URL is missing or broken.
- **Slow-request logging** — any request over 1 s is logged with its path, and
  every response carries `X-Response-Time-Ms`. This is how you find the next
  missing index in production.

### Security hardening

- Security headers from both nginx and the API: `X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, a CSP, and HSTS
  when `ENV=production`.
- `server_tokens off` so nginx stops advertising its version.

Tighten the CSP `connect-src` and `img-src` to your real API and image hosts
before launch — the shipped policy is permissive enough to work out of the box.

### Error handling

`src/components/ErrorBoundary.tsx` wraps the whole app. A render crash now shows
a recoverable screen with reload and home actions instead of a white page.

### CI

`.github/workflows/ci.yml` spins up PostgreSQL, verifies the FastAPI app imports
and all routes register, creates the schema and runs the seed, then type-checks
and builds the frontend. This catches the class of bug that only appears at
import or build time.
