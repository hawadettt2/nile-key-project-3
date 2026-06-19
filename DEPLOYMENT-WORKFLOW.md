# Nile-Key3 Deployment and Supabase Operations

## 1. Local validation

Run these before pushing:

```powershell
npx.cmd tsc --noEmit --pretty false
npx.cmd next build
```

## 2. Commit and push to GitHub

From project root:

```powershell
git add .
git commit -m "chore: harden RBAC, audit logging, and deployment docs"
git push origin main
```

If you want to review before pushing:

```powershell
git status --short
git diff --stat
git diff --cached
```

## 3. Supabase migration order

Run SQL files in this exact order in Supabase SQL Editor:

1. `schema.sql`
2. `src/migrations/rbac-hardening.sql`
3. `migrations/01-audit-triggers.sql`

Do not run them in reverse. `rbac-hardening.sql` assumes schema tables exist, and `01-audit-triggers.sql` assumes audit tables and business tables exist.

## 4. Supabase environment variables

Set these in Supabase project settings:

- Project URL: `NEXT_PUBLIC_SUPABASE_URL`
- Anon public key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Service role key: `SUPABASE_SERVICE_ROLE_KEY`

For Vercel/production, also configure:

- `RESEND_API_KEY`
- `RESEND_AUDIENCE`
- `EMAIL_FROM`
- `NEXT_PUBLIC_SITE_URL`
- `HUGGINGFACE_API_KEY` if AI features are enabled

## 5. Vercel deployment

After push, Vercel will deploy automatically if connected to this GitHub repository.

Manual CLI deploy:

```powershell
npx.cmd vercel pull
npx.cmd vercel build
npx.cmd vercel deploy --prod
```

## 6. Post-deployment integrity checks

Run:

```powershell
npx.cmd tsc --noEmit --pretty false
npx.cmd next build
```

Then manually verify:

- Login/register works.
- New user profile is created.
- Email verification code request works.
- Email verification confirmation works.
- Role request creation works.
- Admin can review role requests.
- Non-admin cannot access `/admin/role-requests`.
- Suspended/rejected users cannot access protected routes.
- Audit logs are created for role/profile changes.
- Audit logs cannot be updated/deleted.

## 7. Security test checklist

Use separate test accounts:

- Owner account
- Admin account
- Employee account
- Importer/Supplier account
- Unverified account

Test:

- IDOR: try reading/updating another user's resources.
- Privilege escalation: try changing role/status without owner/admin privileges.
- Email verification: try verifying another user's email.
- Middleware: ensure unverified users are redirected to `/login?verify=true` without loops.
- Service role key: confirm it never appears in client bundles or browser network requests.
