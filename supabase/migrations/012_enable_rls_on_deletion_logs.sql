-- Migration: Enable Row Level Security (RLS) on deletion_logs table
-- Description: Fix security vulnerability by enabling RLS. No policies are added because this is a system/audit log table only written to by Edge Functions using the service_role key, and queried via the SQL editor.

-- Enable Row Level Security (RLS)
ALTER TABLE public.deletion_logs ENABLE ROW LEVEL SECURITY;
