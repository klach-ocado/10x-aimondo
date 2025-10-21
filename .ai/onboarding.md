# Project Onboarding: AImondo

## Welcome

Welcome to AImondo! This document provides a summary to help you get started with the project. AImondo is a web application that allows users to upload and visualize their GPX workouts on a map, with a special focus on a heatmap-style representation.

## Project Overview & Structure

AImondo is a full-stack application built with Astro, React, and Supabase. The project is structured to separate concerns, with a clear distinction between frontend components, backend services, and database management.

- **`src`**: Contains all the source code.
  - **`components`**: Houses React components for interactive UI elements and Astro components for static content.
  - **`pages`**: Includes Astro pages for routing and API endpoints for backend logic.
  - **`lib`**: Contains business logic in the form of services and helper functions.
  - **`db`**: Manages the Supabase client and database types.
- **`e2e`**: Holds end-to-end tests written with Playwright.
- **`supabase`**: Contains database migrations and Supabase configuration.
- **`.github/workflows`**: Defines CI/CD pipelines for testing and deployment.

## Core Modules

### `Map Interaction`

- **Role:** This is the core of the application, responsible for rendering workout tracks and heatmaps.
- **Key Files/Areas:**
  - `src/components/Map.tsx`: The main React component for the map interface.
  - `src/components/hooks/useMap.ts`: A custom hook that encapsulates the logic for interacting with the Maplibre GL JS library.
  - `src/pages/api/heatmap.ts`: The API endpoint that provides data for the heatmap layer.
- **Recent Focus:** This area has undergone significant refactoring to improve performance and maintainability.

### `Workout Management`

- **Role:** This module handles the CRUD (Create, Read, Update, Delete) operations for workouts.
- **Key Files/Areas:**
  - `src/pages/api/workouts/`: API endpoints for managing workouts.
  - `src/components/dashboard/`: React components for the user's workout dashboard, including the data table, filters, and dialogs for adding/editing/deleting workouts.
  - `src/lib/services/workout.service.ts`: The service that contains the business logic for workout management.
- **Recent Focus:** Recent work has focused on improving the user experience of the workout dashboard and refactoring the underlying API endpoints.

### `Authentication`

- **Role:** Manages user authentication and authorization.
- **Key Files/Areas:**
  - `src/pages/api/auth/`: API endpoints for handling authentication-related tasks like login, logout, and password reset.
  - `src/components/auth/`: React components for the login, registration, and password reset forms.
  - `src/middleware/index.ts`: Astro middleware for protecting routes and managing user sessions.
- **Recent Focus:** Recent changes include fixes for the password reset flow.

## Key Contributors

- **Krzysztof Lach**: Appears to be the primary or sole contributor to the project, with a focus on all aspects of the application, from backend to frontend and CI/CD.

## Overall Takeaways & Recent Focus

- The project is well-structured and uses a modern tech stack.
- There is a strong emphasis on code quality, with comprehensive testing and linting.
- Recent development has been heavily focused on refactoring and improving the core functionalities, especially the map and data visualization features.
- The use of both Astro and React requires a good understanding of their integration and the division of responsibilities between them.

## Potential Complexity/Areas to Note

- **Map Integration:** The interaction with Maplibre GL JS, especially for rendering GPX tracks and the heatmap, can be complex. The `useMap.ts` hook is a good starting point for understanding this part of the application.
- **Data Flow:** Understanding the flow of data from the Supabase backend to the frontend components, through API endpoints and custom hooks, is crucial.
- **Astro vs. React:** Knowing when to use an Astro component versus a React component is key to maintaining the project's architecture.

## Questions for the Team

1. What are the long-term goals for AImondo? Are there any plans to add features beyond the current MVP scope?
2. Could you walk me through the data flow for the heatmap feature, from the database query to the rendering on the map?
3. What is the strategy for handling large GPX files? Are there any performance considerations to keep in mind?
4. Are there any specific parts of the codebase that you would like me to focus on first?
5. How is the local development database managed? Is it seeded with any test data?
6. What is the release process? Are deployments automated?
7. Are there any known issues or technical debt that I should be aware of?

## Next Steps

1. **Set up the development environment:** Follow the instructions in the `README.md` to get the project running locally.
2. **Explore the map functionality:** Spend time understanding how the `Map.tsx` component and the `useMap.ts` hook work together to render workout data.
3. **Review the testing setup:** Familiarize yourself with the unit tests (Vitest) and end-to-end tests (Playwright) to understand how to write and run tests for your changes.
4. **Try adding a small feature:** A good way to start could be to add a new filter to the workouts dashboard or a new piece of information to the workout view.
5. **Read the `GEMINI.md` file:** This file contains detailed coding practices and guidelines that are specific to this project.

## Development Environment Setup

To set up the development environment, follow these steps:

1.  **Prerequisites:** Make sure you have Node.js (version 22.16.0) and `npm` installed.
2.  **Clone the repository:** `git clone https://github.com/klach-ocado/10x-aimondo.git`
3.  **Install dependencies:** `npm install`
4.  **Set up environment variables:** Copy `.env.example` to `.env` and add your Supabase project URL and anon key.
5.  **Run the development server:** `npm run dev`

The application will be available at `http://localhost:3000`.

## Helpful Resources

- **Astro:** https://astro.build/
- **React:** https://react.dev/
- **TypeScript:** https://www.typescriptlang.org/
- **Tailwind CSS:** https://tailwindcss.com/
- **Shadcn/ui:** https://ui.shadcn.com/
- **Maplibre GL JS:** https://maplibre.org/
- **Supabase:** https://supabase.com/
- **Vitest:** https://vitest.dev/
- **Playwright:** https://playwright.dev/
