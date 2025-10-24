# AImondo

A web application for outdoor enthusiasts to visualize their GPX-recorded workouts on an interactive map, featuring a global heatmap of all activities.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

AImondo is designed for users who regularly track their activities (like running or cycling) using GPS and want a simple, aggregated view of all their routes. The application allows users to upload GPX files, manage their workouts, and visualize the tracks on a map. Its key feature is a global heatmap, which helps users see their most frequented paths and discover unexplored areas. User authentication is handled by Supabase to ensure data privacy.

## Screenshots

Sample screenshots of the application can be found in the [screenshots](./screenshots) directory.

## Tech Stack

### Frontend

- **Framework**: [Astro 5](https://astro.build/)
- **UI Library**: [React 19](https://react.dev/) for interactive components
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind 4](https://tailwindcss.com/)
- **Components**: [Shadcn/ui](https://ui.shadcn.com/)
- **Maps**: [Maplibre GL JS](https://maplibre.org/)

### Backend

- **Platform**: [Supabase](https://supabase.com/)
  - PostgreSQL Database
  - Backend-as-a-Service (BaaS)
  - User Authentication

### CI/CD & Hosting

- **CI/CD**: [GitHub Actions](https://github.com/features/actions)
- **Hosting**: [Cloudflare Pages](https://pages.cloudflare.com/)

## Getting Started Locally

To run this project locally, follow these steps.

### Prerequisites

- **Node.js**: Version `22.16.0` is required. We recommend using a version manager like `nvm`.
  ```sh
  nvm use
  ```
- **Package Manager**: `npm`, `yarn`, or `pnpm`. This guide uses `npm`.

### Installation

1.  **Clone the repository:**

    ```sh
    git clone https://github.com/klach-ocado/10x-aimondo.git
    cd 10x-aimondo
    ```

2.  **Install dependencies:**

    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file by copying the example file. You will need to provide your Supabase project URL and anon key.

    ```sh
    cp .env.example .env
    ```

    Your `.env` file should look like this:

    ```
    SUPABASE_URL="your-supabase-url"
    SUPABASE_KEY="your-supabase-anon-key"
    ```

4.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

## Available Scripts

The following scripts are available in the `package.json`:

- `npm run dev`: Starts the development server.
- `npm run dev:e2e`: Starts the development server in test mode.
- `npm run build`: Builds the application for production.
- `npm run preview`: Previews the production build locally.
- `npm run lint`: Lints the codebase using ESLint.
- `npm run lint:fix`: Lints the codebase and automatically fixes issues.
- `npm run format`: Formats the code using Prettier.
- `npm test`: Runs unit and integration tests using Vitest.
- `npm run test:ui`: Runs unit and integration tests with a graphical interface.
- `npm run test:coverage`: Runs unit and integration tests and generates coverage report.
- `npm run test:e2e`: Runs end-to-end tests using Playwright.
- `npm run test:e2e:ui`: Runs end-to-end tests with the Playwright UI for debugging.

## Testing

This project uses a combination of testing strategies to ensure code quality and application stability:

- **Unit & Integration Tests**: [Vitest](https://vitest.dev/) is used for testing individual components, functions, and services in isolation. These tests are located alongside the source code in `*.test.ts` files.
- **End-to-End (E2E) Tests**: [Playwright](https://playwright.dev/) is used for simulating real user scenarios across the entire application stack. These tests cover critical user flows, such as authentication, workout management (CRUD), and data isolation between users. E2E tests are located in the `e2e` directory.

All tests are automated and run via [GitHub Actions](https://github.com/features/actions) on every pull request to the main branch to maintain a high standard of quality.

## Project Scope

### Included in MVP

- User authentication (login/registration).
- Full CRUD (Create, Read, Update, Delete) functionality for workouts.
- GPX file uploading and parsing.
- A paginated and filterable list view of all workouts.
- Map visualization for individual workout tracks.
- A global heatmap view generated from all user workouts.

### Not Included in MVP

- Sharing routes or data between users.
- Integrations with third-party services like Strava or Garmin Connect.
- Paid subscriptions or advanced user plans.
- Generation of route thumbnails (short polylines).

## Project Status

This is a personal side-project. Its success is measured by the author's satisfaction with the final tool's functionality and aesthetics rather than formal KPIs. The project is currently under active development.

## License

This project is licensed under the MIT License.
