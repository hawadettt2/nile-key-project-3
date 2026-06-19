# Nile-Key3 API Documentation

This document describes the current application API routes, expected authentication headers, roles, request payloads, and response shape.

## Authentication

All non-public API routes require:

```http
Authorization: Bearer <supabase-access-token>
Content-Type: application/json
```

API handlers use `src/lib/api-auth.ts` to validate the bearer token, load the authenticated Supabase user, and read the matching `public.profiles` record.

## Response Shape

Most routes return:

```json
{
  "success": true,
  "data": {}
}
```

Errors return:

```json
{
  "success": false,
  "error": "Error message"
}
```

---

## Auth APIs

### `POST /api/auth/register`

Creates a new user with service-role privileges.

**Public:** Yes.

**Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "Optional Name"
}
```

**Notes:**
- Password must be at least 8 characters.
- The created profile starts as `مستخدم مسجل`.
- `email_verified` is set to `false` and must be completed through email verification.

---

### `POST /api/auth/email-verify`

Requests a verification code for the authenticated user's email.

**Public:** No.

**Body:**

```json
{
  "email": "user@example.com"
}
```

**Notes:**
- Email must match the authenticated user's email.
- Resend is used when `RESEND_API_KEY` and `RESEND_AUDIENCE` are configured.
- In development without Resend, the code is returned only when `NODE_ENV=development`.

---

### `PUT /api/auth/email-verify`

Verifies the authenticated user's email code.

**Public:** No.

**Body:**

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Notes:**
- Email must match the authenticated user's email.
- The code expires after 10 minutes.

---

## Profile APIs

### `GET /api/profile`

Returns the authenticated user's profile.

**Roles:** Any active authenticated user.

---

### `POST /api/profile`

Updates profile fields.

**Roles:**
- User may update their own profile.
- `مالك` or `إشراف إداري` may update another profile by sending `userId`.

**Body:**

```json
{
  "displayName": "Name",
  "phone": "+201000000000",
  "country": "Egypt",
  "userId": "optional-target-user-id"
}
```

---

## Role Management APIs

### `POST /api/role-requests/create`

Creates a role change request for the authenticated user.

**Roles:** Any active email-verified user.

**Body:**

```json
{
  "role": "مستورد",
  "reason": "سبب الطلب"
}
```

**Rules:**
- Only one pending request per profile is allowed.
- Requesting the current role returns `409`.

---

### `POST /api/role-change-requests`

Compatibility alias for `/api/role-requests/create`.

---

### `GET /api/role-requests`

Lists pending role change requests.

**Roles:** `مالك`, `إشراف إداري`.

---

### `POST /api/role-requests`

Approves or rejects a pending role request.

**Roles:** `مالك`, `إشراف إداري`.

**Body:**

```json
{
  "requestId": "uuid",
  "approve": true
}
```

**Rules:**
- A user cannot review their own request.
- Role changes are validated through `canModifyRole`.
- Approval updates `profiles.role`, `profiles.status`, and `user_roles`.

---

## Admin APIs

### `GET /api/admin/users`

Lists all profiles.

**Roles:** `مالك`, `إشراف إداري`.

---

### `POST /api/admin/users`

Updates user role/status.

**Roles:** `مالك`, `إشراف إداري`.

**Body:**

```json
{
  "userId": "uuid",
  "newRole": "موظف",
  "newStatus": "active"
}
```

**Rules:**
- Admins cannot modify their own account unless they are `مالك`.
- Role/status changes are validated through `canModifyRole` and `canModifyStatus`.

---

## Business APIs

### `GET /api/customers`

Lists customers.

**Roles:** `مالك`, `إشراف إداري`, `موظف`.

### `POST /api/customers`

Creates a customer for the authenticated user.

**Roles:** `مالك`, `إشراف إداري`, `موظف`.

---

### `GET /api/suppliers`

Lists suppliers.

**Roles:** `مالك`, `إشراف إداري`, `موظف`, `مستورد`, `مصدر`.

### `POST /api/suppliers`

Creates a supplier.

**Roles:** `مالك`, `إشراف إداري`, `موظف`.

---

### `GET /api/shipments`

Lists shipments.

**Roles:**
- `مالك`, `إشراف إداري`, `موظف`: all shipments.
- Other active users: their own shipments.

### `POST /api/shipments`

Creates a shipment for the authenticated user.

**Roles:** Any active user.

---

## Export Platform APIs

### `GET /api/export/opportunities`

Lists export opportunities with optional filters: `country`, `status`, `minConfidence`, `search`.

**Roles:** Any active authenticated user.

### `POST /api/export/opportunities`

Creates an export opportunity.

**Roles:** `مالك`, `إشراف إداري`, `موظف`, `مصدر`.

### `PATCH /api/export/opportunities`

Updates an opportunity.

**Roles:**
- `مالك`, `إشراف إداري`, `موظف`: any opportunity.
- Discoverer: their own opportunity.

---

### `GET /api/export/tasks`

Lists employee tasks.

**Roles:**
- `مالك`, `إشراف إداري`, `موظف`: tasks for any `userId`.
- Others: their own tasks.

### `POST /api/export/tasks`

Creates an employee task.

**Roles:** `مالك`, `إشراف إداري`, `موظف`.

### `PATCH /api/export/tasks`

Updates task status.

**Roles:**
- `مالك`, `إشراف إداري`, `موظف`: any task.
- Assignee or assigner: their own related task.

---

### `GET /api/export/alerts`

Lists alerts for the authenticated user or another user if owner.

### `POST /api/export/alerts`

Creates an alert for the authenticated user.

### `PATCH /api/export/alerts`

Updates alert read/dismissed state.

---

### `GET /api/export/hs-codes`

Lists HS codes with optional filters.

### `POST /api/export/hs-codes`

Creates an HS code.

**Roles:** `مالك`, `إشراف إداري`.

---

### `GET /api/export/supplier-ratings`

Lists ratings for a supplier.

**Required query:** `supplierId`.

### `POST /api/export/supplier-ratings`

Creates a supplier rating.

---

## Content APIs

### `GET /api/trade-sources`

Lists verified trade sources.

### `GET /api/important-sites`

Lists important sites.

**Roles:**
- `مالك`: all sites.
- Others: their own sites.

### `POST /api/important-sites`

Creates an important site for the authenticated user.

---

## Database Hardening Migrations

### `schema.sql`

Main schema, RBAC tables, RLS policies, profile trigger, grants.

### `src/migrations/rbac-hardening.sql`

Hardens role management RLS, adds `updated_at` triggers, and ensures `on_auth_user_created` exists.

### `migrations/01-audit-triggers.sql`

Adds audit triggers for core tables and prevents audit log mutation/deletion.

### `src/migrations/role-rules.sql`

Legacy role RLS policy file. Prefer `src/migrations/rbac-hardening.sql` for the hardened policy set.

---

## Remaining Production Notes

Before production deployment, review these items in Supabase SQL Editor:

1. Run migrations in order:
   - `schema.sql`
   - `src/migrations/rbac-hardening.sql`
   - `migrations/01-audit-triggers.sql`

2. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `RESEND_AUDIENCE`
   - `EMAIL_FROM`

3. Perform security testing for:
   - IDOR
   - Privilege escalation
   - Service Role Key exposure
   - RLS policy behavior with anon/authenticated clients

4. Keep `.env.local` out of commits and never expose `SUPABASE_SERVICE_ROLE_KEY` to client code.
