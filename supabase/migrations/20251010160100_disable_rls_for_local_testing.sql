-- Migration: disable_rls_for_local_testing
-- Description: Disables Row-Level Security for all tables for local testing purposes.
-- WARNING: This should only be used in a local development environment.

alter table public.workouts disable row level security;
alter table public.track_points disable row level security;
