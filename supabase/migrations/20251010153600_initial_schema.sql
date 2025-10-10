-- Migration: initial_schema
-- Description: Creates the initial database schema for AImondo, including workouts and track_points tables.
-- Tables affected: public.workouts, public.track_points
-- Remarks: This migration sets up the foundational tables for storing workout data and their corresponding GPS track points. It includes enabling PostGIS, creating tables with appropriate constraints, setting up Row-Level Security (RLS) policies, and adding performance-optimizing indexes.

-- Enable the PostGIS extension if it's not already enabled.
-- This is crucial for handling geometric data types used for storing GPS coordinates.
create extension if not exists postgis;

-- Table: public.workouts
-- Stores metadata for workouts uploaded by users.
create table public.workouts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id),
    name varchar(300) not null,
    date timestamptz not null,
    type varchar(50) not null,
    distance integer not null,
    duration integer,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Add comments to the columns of the workouts table for better documentation.
comment on column public.workouts.id is 'Unique identifier for the workout.';
comment on column public.workouts.user_id is 'Identifier of the user from the auth.users table.';
comment on column public.workouts.name is 'User-provided name for the workout.';
comment on column public.workouts.date is 'Date and time of the workout.';
comment on column public.workouts.type is 'Type of activity (e.g., "run", "bike").';
comment on column public.workouts.distance is 'Total distance of the workout in meters.';
comment on column public.workouts.duration is 'Total duration of the workout in seconds.';
comment on column public.workouts.created_at is 'Timestamp of when the record was created.';
comment on column public.workouts.updated_at is 'Timestamp of when the record was last updated.';

-- Table: public.track_points
-- Stores geographic points (coordinates) for each workout.
create table public.track_points (
    id bigserial primary key,
    workout_id uuid not null references public.workouts(id) on delete cascade,
    location geometry(point, 4326) not null,
    elevation real,
    "timestamp" timestamptz,
    sequence_number integer not null
);

-- Add comments to the columns of the track_points table.
comment on column public.track_points.id is 'Unique identifier for the track point.';
comment on column public.track_points.workout_id is 'Identifier of the workout to which the point belongs.';
comment on column public.track_points.location is 'Geographic coordinates of the point (longitude, latitude).';
comment on column public.track_points.elevation is 'Elevation in meters above sea level.';
comment on column public.track_points.timestamp is 'Timestamp when the point was recorded.';
comment on column public.track_points.sequence_number is 'Sequential number of the point within the workout.';

-- Indexes for public.workouts table
-- A composite index to optimize queries for a user''s workouts, sorted by date.
create index idx_workouts_user_id_date on public.workouts(user_id, date desc);
-- An index on user_id to speed up filtering and joins.
create index idx_workouts_user_id on public.workouts(user_id);
-- An index on the type of workout to speed up filtering by activity type.
create index idx_workouts_type on public.workouts(type);

-- Indexes for public.track_points table
-- A GiST spatial index on the location column to drastically speed up geographic queries.
create index idx_track_points_location on public.track_points using gist(location);

-- Row-Level Security (RLS) for public.workouts
-- Enable RLS to ensure users can only access their own data.
alter table public.workouts enable row level security;

-- RLS Policies for public.workouts

-- Policy: Allow users to select their own workouts.
-- This policy ensures that users can only read workout records that they own.
create policy "Allow authenticated users to select their own workouts"
on public.workouts for select
to authenticated
using (auth.uid() = user_id);

-- Policy: Allow users to insert their own workouts.
-- This policy ensures that users can only create new workout records for themselves.
create policy "Allow authenticated users to insert their own workouts"
on public.workouts for insert
to authenticated
with check (auth.uid() = user_id);

-- Policy: Allow users to update their own workouts.
-- This policy ensures that users can only modify workout records that they own.
create policy "Allow authenticated users to update their own workouts"
on public.workouts for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Policy: Allow users to delete their own workouts.
-- This policy ensures that users can only remove workout records that they own.
create policy "Allow authenticated users to delete their own workouts"
on public.workouts for delete
to authenticated
using (auth.uid() = user_id);

-- Row-Level Security (RLS) for public.track_points
-- Enable RLS to ensure data privacy, although access is indirectly controlled via workouts table.
alter table public.track_points enable row level security;

-- RLS Policies for public.track_points

-- Policy: Allow users to select track points for their own workouts.
-- This policy ensures that users can only read track points associated with workouts they own.
-- It works by checking the user_id on the related workouts table.
create policy "Allow select own track_points"
on public.track_points for select
to authenticated
using (
  exists (
    select 1
    from public.workouts w
    where w.id = track_points.workout_id
      and w.user_id = auth.uid()
  )
);

-- Policy: Allow users to insert track points for their own workouts.
-- This policy ensures that users can only add track points to workouts they own.
create policy "Allow insert own track_points"
on public.track_points for insert
to authenticated
with check (
  exists (
    select 1
    from public.workouts w
    where w.id = track_points.workout_id
      and w.user_id = auth.uid()
  )
);

-- Policy: Allow users to update track points for their own workouts.
-- This policy ensures that users can only modify track points associated with workouts they own.
create policy "Allow update own track_points"
on public.track_points for update
to authenticated
using (
  exists (
    select 1
    from public.workouts w
    where w.id = track_points.workout_id
      and w.user_id = auth.uid()
  )
);

-- Policy: Allow users to delete track points for their own workouts.
-- This policy ensures that users can only remove track points associated with workouts they own.
create policy "Allow delete on own track_points"
on public.track_points for delete
to authenticated
using (
  exists (
    select 1
    from public.workouts w
    where w.id = track_points.workout_id
      and w.user_id = auth.uid()
  )
);
