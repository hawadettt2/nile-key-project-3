-- =====================================================
-- 2026-06-16: Safe update of user_role enum to Arabic values
-- Run this on an existing database that still has old English role values.
-- For a brand new clean database, schema.sql already creates the Arabic enum.
-- =====================================================

DO $$
DECLARE
  has_old_roles boolean;
  has_arabic_roles boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'user_role'
      AND t.typnamespace = 'public'::regnamespace
      AND e.enumlabel IN ('owner', 'admin', 'employee', 'importer', 'supplier', 'agent', 'user')
  ) INTO has_old_roles;

  SELECT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'user_role'
      AND t.typnamespace = 'public'::regnamespace
      AND e.enumlabel = 'مالك'
  ) INTO has_arabic_roles;

  IF has_old_roles AND NOT has_arabic_roles THEN
    ALTER TYPE public.user_role RENAME TO user_role_old;

    CREATE TYPE public.user_role AS ENUM (
      'مالك',
      'إشراف إداري',
      'موظف',
      'مستورد',
      'مورد',
      'مصدر',
      'مستخدم مسجل',
      'زائر'
    );

    ALTER TABLE public.profiles
      ALTER COLUMN role DROP DEFAULT;

    UPDATE public.profiles
    SET role = CASE
      WHEN role::text = 'owner' THEN 'مالك'::public.user_role
      WHEN role::text = 'admin' THEN 'إشراف إداري'::public.user_role
      WHEN role::text = 'employee' THEN 'موظف'::public.user_role
      WHEN role::text = 'importer' THEN 'مستورد'::public.user_role
      WHEN role::text = 'supplier' THEN 'مورد'::public.user_role
      WHEN role::text = 'agent' THEN 'مصدر'::public.user_role
      WHEN role::text = 'user' THEN 'مستخدم مسجل'::public.user_role
      ELSE 'مستخدم مسجل'::public.user_role
    END;

    ALTER TABLE public.profiles
      ALTER COLUMN role TYPE public.user_role USING role::public.user_role;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'role_change_requests'
        AND column_name = 'requested_role'
    ) THEN
      ALTER TABLE public.role_change_requests
        ALTER COLUMN requested_role TYPE public.user_role USING requested_role::public.user_role;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_roles'
        AND column_name = 'role'
    ) THEN
      ALTER TABLE public.user_roles
        ALTER COLUMN role TYPE public.user_role USING role::public.user_role;
    END IF;

    ALTER TABLE public.profiles
      ALTER COLUMN role SET DEFAULT 'مستخدم مسجل'::public.user_role;

    DROP TYPE public.user_role_old;
  ELSIF has_arabic_roles THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'role'
    ) THEN
      ALTER TABLE public.profiles
        ALTER COLUMN role SET DEFAULT 'مستخدم مسجل'::public.user_role;
    END IF;
  END IF;
END $$;
