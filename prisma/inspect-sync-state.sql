-- NestKeep — READ-ONLY inspection of the remote sync state.
-- Run this in the Supabase SQL editor (or psql) to see which reality you're in
-- before applying enable-realtime-sync.sql.

-- 1. Is RLS enabled on the synced tables? (If yes + the auth.uid() policies from
--    rls-policies.sql are present, the anon app can neither read nor write.)
SELECT relname AS table, relrowsecurity AS rls_enabled
FROM pg_class
WHERE relkind = 'r'
  AND relname IN ('households','settings','accounts','transactions','transfers','savings_goals')
ORDER BY relname;

-- 2. What policies exist, and for which role?
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('households','settings','accounts','transactions','transfers','savings_goals')
ORDER BY tablename, policyname;

-- 3. Which tables are already in the Realtime publication?
SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
ORDER BY tablename;

-- 4. Are pushes actually landing on the server?
SELECT 'accounts' AS t, count(*) FROM accounts
UNION ALL SELECT 'transactions', count(*) FROM transactions
UNION ALL SELECT 'transfers', count(*) FROM transfers
UNION ALL SELECT 'savings_goals', count(*) FROM savings_goals
UNION ALL SELECT 'households', count(*) FROM households;
