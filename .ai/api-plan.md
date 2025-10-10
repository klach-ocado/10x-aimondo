# REST API Plan

## 1. Resources

- **Workout**: Represents a single workout activity. Corresponds to the `public.workouts` table.
- **Track Point**: Represents a single geographical point within a workout. Corresponds to the `public.track_points` table. Data is primarily accessed via the Workout resource.
- **Heatmap**: A virtual resource representing the aggregated track point data for heatmap visualization.

## 2. Endpoints

### Workouts

#### Create a new workout from a GPX file

- **Method**: `POST`
- **Path**: `/api/workouts`
- **Description**: Uploads a GPX file, parses it, calculates statistics (distance, duration), and creates a new workout record with its associated track points. The request should be `multipart/form-data`.
- **Request Body**: `multipart/form-data`
  - `name` (text): The name of the workout (3-300 characters).
  - `gpxFile` (file): The GPX file (max 5MB).
- **Success Response**:
  - **Code**: `201 Created`
  - **Body**: The newly created workout object (excluding track points).
    ```json
    {
      "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "user_id": "f0e9d8c7-b6a5-4321-fedc-ba9876543210",
      "name": "Morning Run",
      "date": "2025-10-26T08:00:00Z",
      "type": "run",
      "distance": 5230,
      "duration": 1850,
      "created_at": "2025-10-26T10:15:00Z",
      "updated_at": "2025-10-26T10:15:00Z"
    }
    ```
- **Error Responses**:
  - `400 Bad Request`: Invalid input (e.g., name too short/long, missing file, invalid GPX file, no track points found).
  - `401 Unauthorized`: User is not authenticated.
  - `413 Payload Too Large`: GPX file exceeds the 5MB limit.

---

#### Get a paginated list of workouts

- **Method**: `GET`
- **Path**: `/api/workouts`
- **Description**: Retrieves a paginated list of the user's workouts with filtering and sorting options.
- **Query Parameters**:
  - `page` (integer, optional, default: 1): The page number for pagination.
  - `limit` (integer, optional, default: 20): The number of items per page.
  - `name` (string, optional): Filter by a fragment of the workout name (case-insensitive).
  - `dateFrom` (string, optional, format: YYYY-MM-DD): Start of the date range filter.
  - `dateTo` (string, optional, format: YYYY-MM-DD): End of the date range filter.
  - `type` (string, optional): Filter by workout type.
  - `sortBy` (string, optional, default: 'date'): Field to sort by (e.g., 'name', 'distance').
  - `order` (string, optional, default: 'desc'): Sort order ('asc' or 'desc').
- **Success Response**:
  - **Code**: `200 OK`
  - **Body**: An object containing pagination metadata and an array of workout objects.
    ```json
    {
      "pagination": {
        "page": 1,
        "limit": 20,
        "totalItems": 5,
        "totalPages": 1
      },
      "data": [
        {
          "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
          "name": "Morning Run",
          "date": "2025-10-26T08:00:00Z",
          "type": "run",
          "distance": 5230,
          "duration": 1850
        }
      ]
    }
    ```
- **Error Responses**:
  - `400 Bad Request`: Invalid query parameter format.
  - `401 Unauthorized`: User is not authenticated.

---

#### Get a single workout with its track

- **Method**: `GET`
- **Path**: `/api/workouts/{id}`
- **Description**: Retrieves the full details of a single workout, including all its track points.
- **URL Parameters**:
  - `id` (UUID): The ID of the workout.
- **Success Response**:
  - **Code**: `200 OK`
  - **Body**: A workout object with a nested array of track points.
    ```json
    {
      "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "name": "Morning Run",
      "date": "2025-10-26T08:00:00Z",
      "type": "run",
      "distance": 5230,
      "duration": 1850,
      "track_points": [
        { "lat": 49.2827, "lng": -123.1207, "ele": 10.5, "time": "2025-10-26T08:00:05Z" },
        { "lat": 49.2828, "lng": -123.1209, "ele": 10.8, "time": "2025-10-26T08:00:10Z" }
      ]
    }
    ```
- **Error Responses**:
  - `401 Unauthorized`: User is not authenticated.
  - `404 Not Found`: No workout with the given ID exists for the current user.

---

#### Update a workout

- **Method**: `PUT`
- **Path**: `/api/workouts/{id}`
- **Description**: Updates the details of a specific workout.
- **URL Parameters**:
  - `id` (UUID): The ID of the workout to update.
- **Request Body**:
  ```json
  {
    "name": "Evening Jog",
    "date": "2025-10-26T18:30:00Z",
    "type": "jogging"
  }
  ```
- **Success Response**:
  - **Code**: `200 OK`
  - **Body**: The updated workout object.
- **Error Responses**:
  - `400 Bad Request`: Invalid input data (e.g., name length, invalid date).
  - `401 Unauthorized`: User is not authenticated.
  - `404 Not Found`: No workout with the given ID exists for the current user.

---

#### Delete a workout

- **Method**: `DELETE`
- **Path**: `/api/workouts/{id}`
- **Description**: Permanently deletes a workout and all its associated track points.
- **URL Parameters**:
  - `id` (UUID): The ID of the workout to delete.
- **Success Response**:
  - **Code**: `204 No Content`
- **Error Responses**:
  - `401 Unauthorized`: User is not authenticated.
  - `404 Not Found`: No workout with the given ID exists for the current user.

### Heatmap

#### Get heatmap data

- **Method**: `GET`
- **Path**: `/api/heatmap`
- **Description**: Retrieves a random sample of up to 10,000 track points within a given map viewport, respecting any active filters. Used for generating the heatmap.
- **Query Parameters**:
  - `bbox` (string): The bounding box of the map view, formatted as `minLng,minLat,maxLng,maxLat`.
  - `name` (string, optional): Filter by a fragment of the workout name.
  - `dateFrom` (string, optional, format: YYYY-MM-DD): Start of the date range filter.
  - `dateTo` (string, optional, format: YYYY-MM-DD): End of the date range filter.
  - `type` (string, optional): Filter by workout type.
- **Success Response**:
  - **Code**: `200 OK`
  - **Body**: An array of points, each point being an array of `[latitude, longitude]`.
    ```json
    {
      "points": [
        [49.2827, -123.1207],
        [49.2828, -123.1209],
        [49.2511, -123.1122]
      ]
    }
    ```
- **Error Responses**:
  - `400 Bad Request`: Bounding box `bbox` is missing or malformed.
  - `401 Unauthorized`: User is not authenticated.

## 3. Authentication and Authorization

- **Mechanism**: Authentication will be handled by Supabase Auth. The client application is responsible for signing up/logging in users and obtaining a JWT.
- **Implementation**: Every request to the API must include the `Authorization: Bearer <SUPABASE_JWT>` header.
- **Authorization**: The Astro backend will use the JWT to initialize the Supabase client for the authenticated user. All database queries will then be executed within that user's context. PostgreSQL Row-Level Security (RLS) policies, as defined in the database plan, will enforce that users can only access and modify their own data. The API code itself does not need to add `WHERE user_id = ...` clauses, as the database enforces this automatically.

## 4. Validation and Business Logic

- **Validation Library**: `zod` will be used in all API endpoints to validate incoming request bodies and query parameters, ensuring type safety and adherence to constraints.

- **Workout Creation (`POST /api/workouts`)**:
  - **Validation**:
    - `name`: Must be a string between 3 and 300 characters.
    - `gpxFile`: Must be present, have a `.gpx` extension, and be under 5MB.
  - **Business Logic**:
    1. The endpoint receives the `multipart/form-data`.
    2. It validates the `name` and file metadata.
    3. The GPX file content is parsed using a server-side library.
    4. The parser must extract all track points (`<trkpt>`) from all tracks (`<trk>`) and segments (`<trkseg>`).
    5. If no track points are found, the request is rejected with a `400` error.
    6. The total distance and duration are calculated from the track points.
    7. A new record is inserted into the `workouts` table.
    8. All extracted track points are inserted into the `track_points` table, linked to the new workout's ID.
    9. The entire operation should be performed within a transaction to ensure data integrity.

- **Workout Update (`PUT /api/workouts/{id}`)**:
  - **Validation**:
    - `name`: Must be a string between 3 and 300 characters.
    - `date`: Must be a valid ISO 8601 timestamp string.
    - `type`: Must be a string between 3 and 50 characters.

- **Heatmap Data (`GET /api/heatmap`)**:
  - **Validation**:
    - `bbox`: Must be a comma-separated string of four numbers.
  - **Business Logic**:
    1. The endpoint constructs a database query to select `location` from `track_points`.
    2. The query joins with the `workouts` table to apply filters (`name`, `dateFrom`, `dateTo`, `type`) and to enforce RLS.
    3. A `ST_MakeEnvelope` PostGIS function is used with the `bbox` parameters to filter points only within the visible map area.
    4. The query uses `TABLESAMPLE SYSTEM (n)` or a similar method to retrieve a random sample of rows, capped at 10,000, to ensure high performance.
