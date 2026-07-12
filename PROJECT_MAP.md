# PROJECT_MAP — Physical Therapy Clinic Management System

> **Generated:** 2026-07-05  
> **Node:** v22.18.0 | **npm:** 10.9.3  
> **Author:** Staff Software Engineer / Tech Lead

---

## [TECH_STACK]

### Frontend (React 19 + Vite 8)

| Package | Version | Notes |
|---------|---------|-------|
| `react` / `react-dom` | `^19.2.7` | Latest stable. Avoid `19.3.0-canary`. |
| `react-router-dom` | `^7.18.1` | Latest stable. |
| `@mui/material` | `^9.1.2` | MUI v9 stable. PigmentCSS-ready. |
| `@emotion/react` | `^11.14.0` | Required MUI peer. |
| `@emotion/styled` | `^11.14.1` | Required MUI peer. |
| `@mui/x-date-pickers` | `^9.8.0` | MUI v9 compatible pickers. |
| `react-hook-form` | `^7.80.0` | Latest v7 stable. v8 is still beta. |
| `@hookform/resolvers` | `^5.0.0` | Zod integration. |
| `@tanstack/react-query` | `^5.100.14` | Server state management. |
| `axios` | `^1.18.1` | HTTP client. |
| `recharts` | `^3.9.2` | Charts library. |
| `date-fns` | `^4.4.0` | Date utilities. |
| `zod` | `^4.4.3` | Validation schema. |
| `vite` | `^8.1.3` | Build tool (Rolldown-based). |
| PWA | — | Manifest + service worker for installable app. |
| `@vitejs/plugin-react` | `^5.x` | Vite React plugin. |
| `typescript` | `~5.8` | Type safety. |
| `vitest` | `^4.1.9` | Testing framework. |
| `@testing-library/react` | `^16.x` | Component testing. |

### Backend (Express + Prisma)

| Package | Version | Notes |
|---------|---------|-------|
| `express` | `^5.2.1` | Express v5 stable. |
| `prisma` | `^7.8.0` | ORM CLI. |
| `@prisma/client` | `^7.8.0` | Generated client. |
| `pg` | `^8.22.0` | PostgreSQL driver. |
| `jsonwebtoken` | `^9.0.3` | JWT auth. |
| `bcryptjs` | `^3.0.3` | Password hashing. |
| `helmet` | `^8.2.0` | HTTP security headers. |
| `cors` | `^2.8.6` | CORS middleware. |
| `express-rate-limit` | `^8.5.2` | Rate limiting. |
| `multer` | `^2.2.0` | File uploads. |
| `winston` | `^3.19.0` | Async logging. |
| `uuid` | `^14.0.1` | ID generation. |
| `zod` | `^4.4.3` | Request validation (shared). |
| `pdf-lib` | `^1.17.1` | PDF generation. |
| `exceljs` | `^4.4.0` | Excel export. |

### Infrastructure

| Tool | Version | Notes |
|------|---------|-------|
| PostgreSQL | `16.x` | Database. |
| pgAdmin | `latest` | DB management UI. |
| Docker | `27.x` | Containerization (if available). |
| Docker Compose | `v2.x` | Multi-container orchestration. |

### Why These Versions

- **MUI v9** (not v7/v6): Latest stable with PigmentCSS integration, better perf.
- **Express v5**: Stable since late 2025. Async error handling built-in, no need for `express-async-errors`.
- **Prisma v7**: Latest major with improved migration engine and driver adapters.
- **react-hook-form v7** (not v8 beta): v8 is still beta; v7 is production-proven.
- **Vite 8**: Rolldown-based, up to 30x faster builds than Vite 7.
- **zod v4**: Improved DX, better error messages.

---

## [SYSTEM_FLOW]

### User Role Hierarchy & Permissions

```
Administrator (full access)
├── User Management (CRUD all users)
├── Therapist Management
├── Receptionist Management
├── Patient Management
├── Appointment Management
├── Treatment Plans
├── Billing
├── Reports & Analytics
└── System Settings

Receptionist (limited)
├── Register Patients
├── Book / Reschedule Appointments
├── Check-in Patients
├── Print Invoices
└── Receive Payments

Therapist (clinical)
├── View Schedule
├── View Assigned Patients
├── Write Assessments (SOAP)
├── Create Treatment Plans
├── Record Session Notes
├── Upload Exercise Files
└── View Patient History

Patient (portal - optional)
├── Login
├── View Appointments
├── View Exercises (HEP)
├── Download Reports
└── View Invoices
```

### Key User Journeys

**Journey 1: Patient Check-in → Treatment → Billing**
```
Receptionist registers patient → books appointment
  → Patient arrives → Receptionist checks in
    → Therapist sees patient → writes SOAP assessment
      → Creates/updates treatment plan
        → Records session notes
          → Billing generates invoice
            → Patient pays → Receipt printed
```

**Journey 2: Daily Clinic Operations**
```
Admin views Dashboard → sees today's schedule
  → Therapist workload visible
    → Revenue snapshot
      → Notifications for reminders
```

### API Endpoint Map

```
POST   /api/auth/login          → Login
POST   /api/auth/register       → Register (admin only)
POST   /api/auth/refresh        → Refresh token
POST   /api/auth/logout         → Logout

GET    /api/users               → List users (admin)
GET    /api/users/:id           → Get user
PUT    /api/users/:id           → Update user
DELETE /api/users/:id           → Soft delete user

GET    /api/patients            → List patients (paginated, searchable)
POST   /api/patients            → Create patient
GET    /api/patients/:id        → Get patient details
PUT    /api/patients/:id        → Update patient
DELETE /api/patients/:id        → Soft delete patient
PATCH  /api/patients/:id/restore → Restore patient

GET    /api/therapists          → List therapists
POST   /api/therapists          → Create therapist
GET    /api/therapists/:id      → Get therapist
PUT    /api/therapists/:id      → Update therapist

GET    /api/appointments        → List appointments (filters: date, therapist, status)
POST   /api/appointments        → Create appointment
PUT    /api/appointments/:id    → Update appointment
PATCH  /api/appointments/:id/status → Update status
DELETE /api/appointments/:id    → Cancel appointment

GET    /api/assessments         → List assessments
POST   /api/assessments         → Create SOAP assessment
GET    /api/assessments/:id     → Get assessment
PUT    /api/assessments/:id     → Update assessment

GET    /api/treatment-plans          → List plans
POST   /api/treatment-plans          → Create plan
GET    /api/treatment-plans/:id      → Get plan with exercises
PUT    /api/treatment-plans/:id      → Update plan
DELETE /api/treatment-plans/:id      → Soft delete plan

GET    /api/exercises            → List exercises
POST   /api/exercises            → Create exercise
POST   /api/exercise-assignments → Assign exercise to plan
PUT    /api/exercise-assignments/:id → Update assignment

GET    /api/session-notes        → List session notes
POST   /api/session-notes        → Create session note
PUT    /api/session-notes/:id    → Update session note

GET    /api/invoices             → List invoices
POST   /api/invoices             → Generate invoice
GET    /api/invoices/:id         → Get invoice with items
PUT    /api/invoices/:id         → Update invoice
POST   /api/invoices/:id/pdf     → Generate PDF

GET    /api/payments             → List payments
POST   /api/payments             → Record payment

GET    /api/reports/daily        → Daily revenue report
GET    /api/reports/monthly      → Monthly revenue report
GET    /api/reports/appointments → Appointment statistics
GET    /api/reports/therapists   → Therapist performance
GET    /api/reports/outstanding  → Outstanding payments

GET    /api/documents           → List documents
POST   /api/documents/upload    → Upload file
DELETE /api/documents/:id       → Delete document

GET    /api/notifications       → Get user notifications
PATCH  /api/notifications/:id/read → Mark as read

GET    /api/settings            → Get settings
PUT    /api/settings            → Update settings

GET    /api/search?q=           → Global search
```

### Database ER (Core Tables)

```
users ──┬── patients
         ├── therapists
         ├── appointments (therapist_id, patient_id)
         ├── assessments (patient_id, therapist_id, appointment_id)
         ├── session_notes (appointment_id, patient_id, therapist_id)
         ├── treatment_plans (patient_id, therapist_id)
         ├── invoices (patient_id)
         ├── payments (invoice_id)
         ├── notifications (user_id)
         ├── audit_logs (user_id)
         └── documents (patient_id)

treatment_plans ──┬── exercise_assignments ── exercises
invoices ─────────── invoice_items
```

**Soft delete** on: `users`, `patients`, `therapists`, `appointments`, `treatment_plans`, `invoices`, `documents`.  
All tables have `created_at`, `updated_at`.  
Audit logs are append-only (no soft delete).

---

## [ARCHITECTURE]

### Project Structure

```
/physio-clinic/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Full data model
│   │   ├── migrations/            # Auto-generated
│   │   └── seed.ts                # 20 therapists, 300 patients, 1000 appointments, etc.
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts             # Environment variables (Zod-validated)
│   │   │   ├── database.ts        # Prisma client singleton
│   │   │   └── cors.ts            # CORS config
│   │   ├── middleware/
│   │   │   ├── authenticate.ts    # JWT verification
│   │   │   ├── authorize.ts       # RBAC: authorize(...roles)
│   │   │   ├── validate.ts        # Zod schema validator
│   │   │   ├── errorHandler.ts    # Global error handler
│   │   │   ├── rateLimiter.ts     # Rate limiting
│   │   │   └── audit.ts           # Audit log middleware
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.schema.ts   # Zod schemas
│   │   │   │   └── auth.test.ts
│   │   │   ├── users/
│   │   │   │   ├── users.routes.ts
│   │   │   │   ├── users.controller.ts
│   │   │   │   ├── users.service.ts
│   │   │   │   └── users.schema.ts
│   │   │   ├── patients/
│   │   │   │   ├── patients.routes.ts
│   │   │   │   ├── patients.controller.ts
│   │   │   │   ├── patients.service.ts
│   │   │   │   └── patients.schema.ts
│   │   │   ├── therapists/
│   │   │   ├── appointments/
│   │   │   ├── assessments/
│   │   │   ├── treatments/
│   │   │   ├── exercises/
│   │   │   ├── session-notes/
│   │   │   ├── billing/
│   │   │   │   ├── invoices/
│   │   │   │   └── payments/
│   │   │   ├── reports/
│   │   │   ├── notifications/
│   │   │   ├── documents/
│   │   │   ├── search/
│   │   │   └── settings/
│   │   ├── shared/
│   │   │   ├── logger.ts          # Winston async logger
│   │   │   ├── errors.ts          # AppError classes
│   │   │   ├── pagination.ts      # Pagination helper
│   │   │   └── utils.ts
│   │   └── app.ts                 # Express app setup
│   ├── uploads/                   # Local file storage
│   ├── tsconfig.json
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/            # Shared UI components
│   │   │   ├── Table/
│   │   │   ├── Card/
│   │   │   ├── SearchBar/
│   │   │   ├── Pagination/
│   │   │   ├── Breadcrumbs/
│   │   │   ├── LoadingSkeleton/
│   │   │   ├── EmptyState/
│   │   │   └── StatusBadge/
│   │   ├── layouts/
│   │   │   ├── MainLayout.tsx     # Sidebar + Topbar + Content
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Topbar.tsx
│   │   │   └── AuthLayout.tsx
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── useAuth.ts
│   │   │   │   └── auth.api.ts
│   │   │   ├── dashboard/
│   │   │   │   ├── DashboardPage.tsx
│   │   │   │   ├── StatsCards.tsx
│   │   │   │   ├── TodayAppointments.tsx
│   │   │   │   ├── RevenueChart.tsx
│   │   │   │   └── RecentPatients.tsx
│   │   │   ├── patients/
│   │   │   │   ├── PatientListPage.tsx
│   │   │   │   ├── PatientDetailPage.tsx
│   │   │   │   ├── PatientForm.tsx
│   │   │   │   └── patient.api.ts
│   │   │   ├── appointments/
│   │   │   │   ├── AppointmentListPage.tsx
│   │   │   │   ├── CalendarView.tsx
│   │   │   │   ├── AppointmentForm.tsx
│   │   │   │   └── appointment.api.ts
│   │   │   ├── assessments/
│   │   │   ├── treatments/
│   │   │   ├── billing/
│   │   │   │   ├── InvoiceListPage.tsx
│   │   │   │   ├── InvoiceDetailPage.tsx
│   │   │   │   ├── PaymentForm.tsx
│   │   │   │   └── billing.api.ts
│   │   │   ├── reports/
│   │   │   ├── settings/
│   │   │   └── users/
│   │   ├── hooks/                 # Custom hooks
│   │   │   ├── usePagination.ts
│   │   │   ├── useDebounce.ts
│   │   │   └── useMediaQuery.ts
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── services/
│   │   │   └── api.ts             # Axios instance with interceptors
│   │   ├── routes/
│   │   │   └── index.tsx          # Route definitions
│   │   ├── theme/
│   │   │   ├── theme.ts           # Light/dark palette
│   │   │   └── palette.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── docker-compose.yml
├── .gitignore
├── README.md
└── PROJECT_MAP.md
```

### Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **Feature-based modules** (not technical layers) | Each module is self-contained: routes, controller, service, schema. Easy to navigate, test, and scale. |
| **No repository pattern** | Prisma Client IS the repository. Wrapping it adds zero value. Directly use `prisma.patient.findMany()` in service layer. |
| **Controller → Service** only | No `repository` layer. Service calls Prisma directly. Controller handles HTTP concerns (req/res). |
| **Zod for validation everywhere** | Shared validation logic. Frontend uses Zod for form schemas, backend uses Zod for request validation. |
| **Winston async logging** | Single logger module. Log to files + console. Levels: error, warn, info, debug. No sync I/O. |
| **JWT + Refresh Tokens** | Access token: 15min. Refresh token: 7d (HTTP-only cookie). |
| **Soft deletes with `deleted_at`** | All major entities get soft delete. Restore via `PATCH .../restore`. |
| **Vite 8 proxy for dev** | Frontend dev server proxies `/api` to backend. |
| **MUI v9 theming** | `createTheme()` with mode toggle. Dark/light stored in localStorage + context. |
| **No Redux** | TanStack Query handles server state. React Context handles auth/theme. No need for Redux. |

### What We Are NOT Building (Anti-Features)

- No real-time chat / messaging
- No telemedicine / video calls
- No SMS integration (email notifications only)
- No multi-language (English only)
- No drag-and-drop calendar (MUI pickers suffice)
- No complex billing codes (CPT/ICD-10 codes tracked as text, no full medical coding)
- No pharmacy / inventory management
- No lab integration

---

## [LOGGING STRATEGY]

### Winston Logger Configuration

```
Logger (shared/logger.ts)
├── level: info (default), debug in development
├── transports:
│   ├── Console (colorized, dev-friendly)
│   ├── File: logs/error.log (level: error)
│   ├── File: logs/combined.log (level: info)
│   └── File: logs/audit.log (audit-specific)
├── format: JSON with timestamp, service name
└── async: all file writes are asynchronous (streams)
```

**Usage in code:**
```ts
import logger from '@/shared/logger';

// Service layer
logger.info('Patient created', { patientId, userId });

// Error handler
logger.error('Failed to create invoice', { error, userId });
```

**Audit logging** is separate — middleware writes to `audit_logs` table for compliance:
```ts
// Middleware captures: user, action, entity, old/new values, IP
// Example: { userId: 1, action: 'UPDATE', entity: 'patient', entityId: 5, ... }
```

**Log levels used:**
- `error` — Unhandled exceptions, DB failures, auth failures
- `warn` — Validation failures, rate limit hits, soft errors
- `info` — Entity CRUD, login/logout, report generation
- `debug` — Query params, timing, development data (not in production)

---

## [ORPHANS & PENDING]

### Current Status
| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Phase 1: Project init, Prisma, Auth | ✅ Complete | Backend: Express+Prisma+JWT auth; Frontend: Vite+React+MUI login |
| 2 | Phase 2: Patient + Therapist management | 🔲 Pending | Backend module scaffolded, frontend pages pending |
| 3 | Phase 3: Appointments + Calendar | 🔲 Pending | Frontend list page exists, full CRUD pending |
| 4 | Phase 4: Assessments (SOAP) | 🔲 Pending | Schema ready, module pending |
| 5 | Phase 5: Treatment Plans + Exercises | 🔲 Pending | Schema ready, module pending |
| 6 | Phase 6: Billing + Payments | 🔲 Pending | Schema ready, module pending |
| 7 | Phase 7: Reports + Analytics | 🔲 Pending | |
| 8 | Phase 8: Notifications + File Uploads | 🔲 Pending | |
| 9 | Phase 9: Testing + Optimization + Docker | 🔲 Pending | Dockerfiles + docker-compose written |
| 10 | PWA support | ✅ Complete | Manifest, service worker, PWA meta tags added |

### What Was Built (Phase 1)

**Backend:**
- `backend/prisma/schema.prisma` — 14 models with enums, relations, indexes, soft deletes
- `backend/prisma/prisma.config.ts` — Prisma 7 config
- `backend/src/config/` — env (Zod-validated), database (Prisma + adapter-pg)
- `backend/src/shared/` — Winston async logger, error classes, pagination helper
- `backend/src/middleware/` — authenticate (JWT), authorize (RBAC), validate (Zod), errorHandler, rateLimiter, audit
- `backend/src/modules/auth/` — POST /api/auth/login, /register, /refresh, GET /api/auth/profile
- `backend/src/modules/users/` — Full CRUD for admin: list, get, create, update, soft-delete, restore
- `backend/prisma/seed.ts` — 1 admin, 20 therapists, 3 receptionists, 300 patients, 1000 appointments, 10 exercises

**Frontend:**
- `frontend/` — Vite 8 + React 19 + TypeScript 6 + MUI 9
- Dark/Light mode toggle with persistent preference
- `frontend/src/services/api.ts` — Axios with interceptor + refresh token rotation
- `frontend/src/contexts/AuthContext.tsx` — Auth state, login/logout, auto-profile fetch
- `frontend/src/contexts/ThemeContext.tsx` — Theme mode with MUI v9
- `frontend/src/layouts/` — AuthLayout (centered card), MainLayout (sidebar + topbar)
- Login page, Dashboard page (stats cards + placeholder lists), Patient list, Appointment list, 404 page

**Infrastructure:**
- `docker-compose.yml` — PostgreSQL 16 + pgAdmin + backend + frontend
- `backend/Dockerfile`, `frontend/Dockerfile` — Multi-stage builds
- `.gitignore`, `backend/.env.example`

### Known Gaps / Decisions Deferred
- **Patient portal** — Optional per requirements; build as minimal read-only view after phase 8.
- **Email service** — Notifications log to DB + console in v1. SMTP integration deferred.
- **PDF templates** — pdf-lib installed for invoice generation; template work deferred to phase 6.
- **Dashboard real data** — Uses placeholder data until backend modules for stats are built (phase 2-3).
- **PWA icons** — SVG only. PNG icons needed for full mobile Chrome support.

### Next Action
Phase 2: Patient + Therapist management (backend CRUD endpoints + frontend pages).
