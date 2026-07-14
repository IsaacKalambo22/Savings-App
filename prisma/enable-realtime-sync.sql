-- NestKeep — enable Realtime AND make remote sync work with the CURRENT app model.
--
-- CONTEXT / WHY THIS IS NEEDED
-- The app talks to Supabase with the ANON key and does NOT sign users in, so
-- auth.uid() is always NULL. The policies in rls-policies.sql are all keyed on
-- auth.uid() membership in household_members — with them active, EVERY anon
-- read returns nothing and EVERY anon write is rejected, so remote sync (push
-- AND pull) silently fails. This script replaces those policies with anon
-- access and turns on Realtime.
--
-- SECURITY NOTE (read before running)
-- With no Supabase Auth, the only thing protecting a household's data is
-- knowledge of its share code (the deterministic household id). Anyone holding
-- the anon key (it ships inside the app and is in eas.json) plus a household id
-- could read/write that household. This matches the app's current no-login
-- design. The PROPER fix is to wire Supabase Auth (even anonymous sign-in) and
-- populate household_members, after which the original auth.uid() policies work
-- and Realtime is scoped per user. Treat this script as the interim step.

BEGIN;

-- 1. Realtime must emit full row images for UPDATE/DELETE payloads.
ALTER TABLE public.households    REPLICA IDENTITY FULL;
ALTER TABLE public.settings      REPLICA IDENTITY FULL;
ALTER TABLE public.accounts      REPLICA IDENTITY FULL;
ALTER TABLE public.transactions  REPLICA IDENTITY FULL;
ALTER TABLE public.transfers     REPLICA IDENTITY FULL;
ALTER TABLE public.savings_goals REPLICA IDENTITY FULL;

-- 2. Add the synced tables to the Realtime publication (idempotent).
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['households','settings','accounts','transactions','transfers','savings_goals']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- 3. Drop the auth.uid()-based policies (they block the anon app) and grant the
--    anon + authenticated roles full access. RLS stays ENABLED; these policies
--    are what permit access. Idempotent — safe to re-run.
DO $$
DECLARE r record; t text;
BEGIN
  FOR r IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('households','settings','accounts','transactions','transfers','savings_goals')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;

  FOREACH t IN ARRAY ARRAY['households','settings','accounts','transactions','transfers','savings_goals']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated', t);
    EXECUTE format('CREATE POLICY "sync anon access"  ON public.%I FOR ALL TO anon          USING (true) WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "sync authd access" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

COMMIT;
