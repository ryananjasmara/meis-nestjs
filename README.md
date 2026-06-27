# Mini ERP Invoicing System — Backend

A NestJS + Prisma + PostgreSQL REST API for a mini ERP invoicing system: authentication, customer management, invoices with multi-currency and PPN, and dashboard summaries.

## Tech stack used

- **Framework:** NestJS 11
- **Database:** PostgreSQL 16 (via Docker)
- **ORM:** Prisma 7
- **Auth:** JWT (`@nestjs/jwt`, `passport-jwt`), passwords hashed with `bcryptjs`
- **Validation:** `class-validator` / `class-transformer` via a global `ValidationPipe`
- **API docs:** Swagger (`@nestjs/swagger`), served at `/docs`

## Prerequisites

- Node.js 20+
- Docker Desktop (for the local PostgreSQL container)

## Installation steps

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

4. Run migrations and generate the Prisma client:

   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. (Optional) Seed sample data:

   ```bash
   npx prisma db seed
   ```

   Seeded logins: `admin@meis.test` / `password123` and `staff@meis.test` / `password123`.

## Running the application locally

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
- **Invoice** (`id`, `invoiceNumber`, `status: DRAFT|SENT|PAID|OVERDUE|CANCELLED`, `issueDate`, `dueDate`, `currency: IDR|USD`, `exchangeRate`, `totalAmount`, `isTaxable`, `vatRate`, `vatAmount`, `grandTotal`, `customerId → Customer`, `createdById → User`) — has many InvoiceItems.
- **InvoiceItem** (`id`, `description`, `quantity`, `unitPrice`, `total`, `invoiceId → Invoice`, cascade-deleted with its invoice).

## API overview

| Module | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login` |
| Customers | `POST /customers`, `GET /customers`, `GET /customers/:id`, `PATCH /customers/:id`, `DELETE /customers/:id` |
| Invoices | `POST /invoices`, `GET /invoices?status=&customerId=&search=`, `GET /invoices/:id`, `PATCH /invoices/:id`, `PATCH /invoices/:id/status`, `POST /invoices/:id/items`, `PATCH /invoices/:id/items/:itemId`, `DELETE /invoices/:id/items/:itemId` |
| Dashboard | `GET /dashboard/summary` |

All routes except `/auth/*` require an `Authorization: Bearer <token>` header. Full request/response shapes are documented in Swagger at `/docs`.

## Architectural decisions & assumptions

- **One module per feature** (`auth`, `customers`, `invoices`, `dashboard`), each with its own controller/service — easy to split into separate microservices later without restructuring.
- **`PrismaService` is a global module**, injected wherever needed instead of being re-imported per feature.
- **Money stored as `Decimal`, not `Float`**, to avoid floating-point rounding errors.
- **`Invoice.totalAmount` is denormalized** (computed when items change, not joined on every read) so list/dashboard queries stay cheap. Items remain the source of truth.
- **Multi-currency (IDR/USD):** each invoice has its own `currency` and `exchangeRate`. The rate is a snapshot taken when the invoice is created (or edited while still `DRAFT`) — it is never re-derived from a "current" rate later, so past invoices and revenue reports don't shift if market rates change.
- **PPN (VAT) is also snapshotted**, not computed from a live config value, for the same reason: changing the standard rate must only affect new invoices, never retroactively change old ones. `isTaxable` defaults to `true` for IDR invoices and `false` for non-IDR (export-of-services) invoices, but can be overridden per invoice while still `DRAFT`.
- **`totalAmount` vs `grandTotal`:** dashboard "Revenue" uses `totalAmount` (pre-tax — PPN collected is owed to the tax office, not company income), while "Outstanding" uses `grandTotal` (what the customer actually still owes, including PPN).
- **Invoice numbers are generated server-side** (`INV-YYYYMMDD-NNNN`), not client-supplied, to guarantee uniqueness and a consistent format.
- **`RolesGuard` + `@Roles()` exist as infrastructure** for role-gating endpoints, though no endpoint currently restricts by role since the test spec didn't call for it.
- **No soft-deletes / audit log** — out of scope for the test's stated requirements; `createdById` on Customer/Invoice gives basic provenance.

## Tests

```bash
npm run test       # unit tests
npm run test:e2e   # e2e tests
```
