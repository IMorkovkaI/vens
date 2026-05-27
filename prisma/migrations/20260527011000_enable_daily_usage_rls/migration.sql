-- Supabase exposes tables in the public schema to API roles unless RLS is enabled.
-- Backend Prisma connections still use direct database credentials; browser clients should not read usage counters.
ALTER TABLE "DailyUsage" ENABLE ROW LEVEL SECURITY;
