CREATE OR REPLACE FUNCTION get_heatmap_points(
    p_user_id UUID,
    min_lng DOUBLE PRECISION,
    min_lat DOUBLE PRECISION,
    max_lng DOUBLE PRECISION,
    max_lat DOUBLE PRECISION,
    p_name TEXT DEFAULT NULL,
    p_date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_type TEXT DEFAULT NULL,
    p_limit INT DEFAULT 10000
)
RETURNS TABLE(lat DOUBLE PRECISION, lng DOUBLE PRECISION) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ST_Y(tp.location::geometry) as lat,
        ST_X(tp.location::geometry) as lng
    FROM
        track_points tp
    JOIN
        workouts w ON tp.workout_id = w.id
    WHERE
        w.user_id = p_user_id AND
        tp.location && ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326) AND
        (p_name IS NULL OR w.name ILIKE '%' || p_name || '%') AND
        (p_date_from IS NULL OR w.date >= p_date_from) AND
        (p_date_to IS NULL OR w.date <= p_date_to) AND
        (p_type IS NULL OR w.type = p_type)
    ORDER BY random()
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
