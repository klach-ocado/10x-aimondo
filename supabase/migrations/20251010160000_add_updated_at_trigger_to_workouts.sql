-- Migration: add_updated_at_trigger_to_workouts
-- Description: Creates a trigger to automatically update the updated_at timestamp on the workouts table.

-- Function to update the updated_at column
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to call the function before any update on the workouts table
create trigger on_updated_at_workouts
before update on public.workouts
for each row
execute procedure public.handle_updated_at();
