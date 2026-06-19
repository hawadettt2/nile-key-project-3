# Nile-Key3 Security and RLS Review Notes

## Completed hardening

- API authentication centralized through `src/lib/api-auth.ts`.
- Role request creation moved to shared service:
  - `src/lib/role-request-service.ts`
- Role request review now prevents:
  - Self-review.
  - Unauthorized target role elevation.
  - Changing immutable request fields during review.
- Admin user update now prevents:
  - Admins modifying their own permissions unless they are `مالك`.
  - Unauthorized role/status transitions through `canModifyRole` and `canModifyStatus`.
- Profile update now prevents client-controlled `userId` escalation.
- Email verification `PUT /api/auth/email-verify` now requires authentication and verifies the email belongs to the authenticated user.
- Middleware no longer redirects `/login?verify=true` into an email verification loop.
- Audit migration now includes:
  - Immutable audit logs.
  - Audit triggers for core business tables.
  - `updated_at` triggers for `profiles` and `role_change_requests`.

## RLS migration order

Run in this order:

1. `schema.sql`
2. `src/migrations/rbac-hardening.sql`
3. `migrations/01-audit-triggers.sql`

## RLS tables hardened by current migrations

- `public.profiles`
- `public.role_change_requests`
- `public.user_roles`
- `public.audit_logs`

## RLS tables requiring manual review before production

Because many APIs currently use the Supabase service role key server-side, database RLS must still be tested independently with anon/authenticated clients.

Review these tables carefully:

- `customers`
- `suppliers`
- `shipments`
- `employee_tasks`
- `export_opportunities`
- `export_alerts`
- `supplier_ratings`
- `hs_codes`
- `trade_sources`
- `important_sites`
- `site_categories`
- `predictive_analytics`
- `nfsa_whitelist`

## API-level security review status

| Route | Status | Notes |
| --- | --- | --- |
| `/api/auth/register` | Reviewed | Service-role registration creates profile with `email_verified=false`. |
| `/api/auth/email-verify` | Hardened | PUT now authenticated; code expiry/hash handled. |
| `/api/profile` | Hardened | Prevents `userId` escalation. |
| `/api/admin/users` | Hardened | Role/status transition checks added. |
| `/api/role-requests/create` | Hardened | Shared service, email verification required. |
| `/api/role-requests` | Hardened | Review authorization and immutable request fields. |
| `/api/customers` | Reviewed | Admin/employee-only route. |
| `/api/suppliers` | Reviewed | Create restricted to admin/employee. |
| `/api/shipments` | Reviewed | Admins see all; users see own shipments. |
| `/api/export/*` | Reviewed | Most have owner/admin checks; continue RLS testing. |
| `/api/important-sites` | Reviewed | Owner sees all; others see own. |
| `/api/trade-sources` | Reviewed | Read-only verified source list. |

## Remaining production checks

1. Test RLS with real Supabase anon/authenticated clients, not only service role APIs.
2. Test IDOR by trying to read/update another user's resources.
3. Test privilege escalation by attempting to change role/status through every API.
4. Confirm `SUPABASE_SERVICE_ROLE_KEY` exists only on server/API routes.
5. Configure Resend or SMTP-equivalent email delivery for production.
6. Run migration scripts in Supabase SQL Editor and verify triggers exist.
7. Review audit log volume and retention before production.
