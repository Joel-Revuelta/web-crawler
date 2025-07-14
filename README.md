# Web Crawler

This is a full-stack web application that allows users to input a website URL, crawl it, and view key information about the page. The application features a Go backend for data collection and a React-based frontend for user interaction and data visualization.

## Features

### Backend

- Crawls a given URL to extract:
  - HTML version
  - Page title
  - Heading tags count (H1, H2, etc.)
  - Number of internal and external links
  - Number of inaccessible links (4xx/5xx status codes)
  - Presence of a login form
- WebSocket support for real-time progress updates.
- API endpoints secured with an API key.

### Frontend

- **URL Management**: Add new URLs for analysis.
- **Results Dashboard**:
  - A paginated and sortable table displaying crawled data.
  - Filters for each column and a global search box.
- **Details View**:
  - A dedicated page for each URL with detailed analysis.
  - A chart visualizing the distribution of internal vs. external links.
  - A list of broken links with their status codes.
- **Real-Time Progress**: Displays the current status of each URL (e.g., queued, running, done, error) via WebSocket.

## Tech Stack

- **Frontend**:
  - React
  - Next.js
  - TypeScript
  - Tailwind CSS
  - Shadcn/ui
  - Tremor (for charts)
  - Playwright (for E2E testing)
- **Backend**:
  - Go
  - Gin (Web Framework)
  - GORM (ORM)
  - Gorilla WebSocket
- **Database**:
  - MySQL
- **DevOps**:
  - Docker
  - Docker Compose

## Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

- Docker
- Docker Compose

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/web-crawler.git
    cd web-crawler
    ```

2.  **Create environment files:**

    You'll need to create `.env` files for both the backend and frontend services.

    -   **Backend (`./backend/.env`):**

        ```env
        DB_SOURCE=mysql_user:1234@tcp(mysql_db:3306)/web_crawler_db?parseTime=true
        API_KEY=your-secret-api-key
        ```

    -   **Frontend (`./frontend/.env`):**

        ```env
        NEXT_PUBLIC_API_URL=http://localhost:8080/api
        NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
        NEXT_PUBLIC_API_KEY=your-secret-api-key
        ```

    *Note: Ensure the `API_KEY` and `NEXT_PUBLIC_API_KEY` values match.*

3.  **Build and run the application:**

    Use Docker Compose to build the images and start the containers.

    ```bash
    docker-compose up -d --build
    ```

    This command will start the `mysql_db`, `go_backend`, and `nextjs_frontend` services in detached mode.

### Accessing the Application

-   **Frontend**: [http://localhost:3000](http://localhost:3000)
-   **Backend API**: [http://localhost:8080](http://localhost:8080)

## Running Tests

The frontend includes end-to-end tests written with Playwright. To run them, you can execute the test command inside the running `frontend` container.

1.  **Open a shell inside the frontend container:**

    ```bash
    docker-compose exec frontend sh
    ```

2.  **Run the tests:**

    ```bash
    npm run test
    ```

## API Endpoints

The backend API is available under the `/api` prefix.

| Method | Endpoint              | Description                               |
| ------ | --------------------- | ----------------------------------------- |
| `GET`  | `/urls`               | Get a paginated list of all URLs.         |
| `POST` | `/urls`               | Add a new URL for crawling.               |
| `GET`  | `/urls/{id}`          | Get details for a specific URL.           |
| `GET`  | `/ws`                 | Establish a WebSocket connection.         |

*All endpoints require an `X-API-Key` header for authorization.*
