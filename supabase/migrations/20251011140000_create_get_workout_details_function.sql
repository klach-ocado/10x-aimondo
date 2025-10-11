-- Migration: create_get_workout_details_function
-- Description: Creates an RPC function to get detailed information about a single workout, including its track points with transformed coordinates.
-- Tables affected: None (creates a function)
-- Remarks: This function is designed to be called from the API to efficiently fetch workout details and associated track points, transforming the PostGIS 'location' geometry into separate 'lat' and 'lng' fields.

create or replace function get_workout_details(p_workout_id uuid, p_user_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  workout_details json;
begin
  select
    json_build_object(
      'id', w.id,
      'name', w.name,
      'date', w.date,
      'type', w.type,
      'distance', w.distance,
      'duration', w.duration,
      'track_points', (
        select coalesce(json_agg(
          json_build_object(
            'lat', st_y(tp.location),
            'lng', st_x(tp.location),
            'ele', tp.elevation,
            'time', tp.timestamp
          ) order by tp.sequence_number
        ), '[]'::json)
        from track_points tp
        where tp.workout_id = w.id
      )
    )
  into workout_details
  from workouts w
  where w.id = p_workout_id and w.user_id = p_user_id;

  return workout_details;
end;
$$;