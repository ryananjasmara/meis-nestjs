# Mini ERP Invoicing System — Backend

A NestJS + Prisma + PostgreSQL REST API for a mini ERP invoicing system: authentication, customer management, invoice creation/items/status, and dashboard summaries.

## Tech stack

- **Framework:** NestJS 11
- **Database:** PostgreSQL 16 (via Docker)
- **ORM:** Prisma 7 (using the `@prisma/adapter-pg` driver adapter, required by Prisma 7's client architecture)
- **Auth:** JWT (`@nestjs/jwt`, `passport-jwt`), passwords hashed with `bcryptjs`
- **Validation:** `class-validator` / `class-transformer`, enforced via a global `ValidationPipe`
- **API docs:** Swagger (`@nestjs/swagger`), served at `/docs`

## Prerequisites

- Node.js 20+
- Docker Desktop (for the local PostgreSQL container)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start PostgreSQL:

   ```bash
   docker compose up -d
   ```

3. Copy/check `.env` — it should already contain:

   ```
   DATABASE_URL="postgresql://meis:meis@localhost:5432/meis_erp?schema=public"
   JWT_SECRET="dev-secret-change-me"
   JWT_EXPIRES_IN="1d"
   ```

4. Run migrations:

   ```bash
   npx prisma migrate dev
   ```

5. (Optional) Seed sample data — two users (one ADMIN, one STAFF), two customers, and four invoices across different statuses:

   ```bash
   npx prisma db seed
   ```

   Seeded logins: `admin@meis.test` / `password123` and `staff@meis.test` / `password123`.

## Running the app

```bash
npm run start:dev
```

- API: `http://localhost:3000`
- Swagger docs: `http://localhost:3000/docs`

## Database schema / ERD

Defined in [`prisma/schema.prisma`](prisma/schema.prisma). Visual ERD: [`docs/ERD.md`](docs/ERD.md).

Summary:

- **User** (`id`, `email`, `password`, `name`, `role: ADMIN|STAFF`) — owns Customers and Invoices it created.
- **Customer** (`id`, `name`, `email?`, `phone?`, `address?`, `createdById → User`) — has many Invoices.
- **Invoice** (`id`, `invoiceNumber`, `status: DRAFT|SENT|PAID|OVERDUE|CANCELLED`, `issueDate`, `dueDate`, `totalAmount`, `customerId → Customer`, `createdById → User`) — has many InvoiceItems.
- **InvoiceItem** (`id`, `description`, `quantity`, `unitPrice`, `total`, `invoiceId → Invoice`, cascade-deleted with its invoice).

## API overview

| Module | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login` |
| Customers | `POST /customers`, `GET /customers`, `GET /customers/:id`, `PATCH /customers/:id`, `DELETE /customers/:id` |
| Invoices | `POST /invoices`, `GET /invoices?status=`, `GET /invoices/:id`, `PATCH /invoices/:id/status`, `POST /invoices/:id/items` |
| Dashboard | `GET /dashboard/summary` |

All routes except `/auth/*` require a `Authorization: Bearer <token>` header. Full request/response shapes are documented in Swagger at `/docs`.

## Architectural decisions & assumptions

- **Service/controller/module separation per feature** (`auth`, `customers`, `invoices`, `dashboard`), each independently testable and exportable — chosen so any of these could be lifted into its own microservice later without restructuring.
- **`PrismaService` is a global module** so every feature module can inject it without re-importing — same role a shared DB client would play if these became separate services talking to a shared database, or separate databases behind a future API gateway.
- **Driver adapter (`@prisma/adapter-pg`) instead of Prisma's built-in connector** — required by Prisma 7's client architecture; positions the app to swap in connection pooling (e.g. PgBouncer) or Postgres-specific tuning without touching application code.
- **Money stored as `Decimal`, not `Float`** — avoids floating-point rounding errors on currency values.
- **`Invoice.totalAmount` is denormalized** (computed at create/item-add time, not derived via a join on every read) — keeps list/dashboard queries cheap; the items remain the source of truth and the total is recalculated any time items change.
- **Invoice numbers are generated server-side** (`INV-YYYYMMDD-NNNN`) rather than client-supplied, to guarantee uniqueness and a consistent format.
- **JWT carries `role`**, and a `RolesGuard` + `@Roles()` decorator exist as infrastructure for role-gating endpoints, though no endpoint currently restricts by role since the test spec didn't call for it — straightforward to apply to any route later (e.g. restricting customer deletion to `ADMIN`).
- **No soft-deletes / audit log** — out of scope for the test's stated requirements; `createdById` on Customer/Invoice provides basic provenance.

## Tests

```bash
npm run test       # unit tests
npm run test:e2e   # e2e tests
```
