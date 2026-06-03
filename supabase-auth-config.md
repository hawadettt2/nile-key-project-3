# Supabase Auth Configuration

## Authentication Model

This project now uses **email and password only**.

### What to configure in Supabase

1. Go to **Authentication > Providers**.
2. Keep **Email** enabled.
3. Disable any phone/SMS-based auth providers you do not use.
4. Ensure the service role key is stored only in server-side environment variables.

### Environment variables required

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `HUGGINGFACE_API_KEY`
- `NEXT_PUBLIC_APP_URL` (optional)

### Important notes

- The owner account is bootstrapped from the database trigger by email.
- The application no longer depends on WhatsApp verification.
- User access is controlled through RBAC and RLS in `schema.sql`.
- The login page accepts email/password only.
