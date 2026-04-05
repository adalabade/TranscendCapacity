# TranscendCapacity 🚀

**TranscendCapacity** is a strategic Resource Allocation and Capacity Management platform designed for modern product teams. It provides a centralized, "airy," and high-performance interface to monitor resource distribution, manage sprint allocations, and export consolidated data for advanced business intelligence.

---

## 🛠 Architecture & Technology Stack

The application follows a **Unified Single-Server Architecture**, optimizing deployment simplicity and performance:

-   **Backend**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
    -   **ORM**: [SQLModel](https://sqlmodel.tiangolo.com/) (SQLAlchemy + Pydantic)
    -   **Database**: [SQLite](https://sqlite.org/) (High-performance relational persistence)
-   **Frontend**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
    -   **Styling**: Premium "Airy" Design (TailwindCSS-inspired Vanilla CSS)
    -   **Icons**: [Lucide-React](https://lucide.dev/)
-   **Serving**: FastAPI serves the production React build (`frontend/dist`) as static assets, eliminating CORS issues and simplifying local execution.

---

## 🌟 Key Functional Modules

### 1. 📊 Allocation Insights (Dashboard)
A high-level analytical view with real-time metrics:
-   **Global Filtering**: Slice data by Release, Sprint, or Process Team.
-   **KPI Cards**: Track Active Resources, Total Allocation, and Average Allocation per Sprint.
-   **Load Profile Matrix**: A detailed audit table showing the exact effort distribution for every resource across the selected scope.

### 2. 👥 Resource Management
A centralized directory for the organization's workforce:
-   Full CRUD (Create, Read, Update, Delete) capability.
-   Integration with **JIRA User IDs** for cross-platform alignment.
-   Attribution to Roles, Teams, companies, and Countries via structured lookup tables.

### 3. 📅 Sprint Allocations
The core engine for effort distribution:
-   Assign resources to specific Assignments within a Release/Sprint.
-   **Effort Mapping**: Visual range-based sliders (0.0 to 15.0) to accurately reflect capacity usage.
-   Composite key management ensuring data integrity between Resource, Release, Sprint, and Assignment.

### 4. 📈 PowerBI Export
Optimized for external business intelligence:
-   **Flattened Dataset**: Performs multi-level outer joins at the database level to provide a "flat-file" view.
-   **Null Handling**: Resources without active allocations are automatically represented with `0.0` values, ensuring accurate denominator calculations in BI tools.
-   **CSV Download**: Standardized export format for instant consumption by PowerBI or Excel.

### 5. ⚙️ Global Settings
Dynamic configuration management:
-   Self-service management of all lookup tables: Roles, Sprints, Releases, Countries, Assignments, Process Teams, and Companies.
-   Reusable CRUD interface for administrative efficiency.

---

## 🚀 Getting Started

### Prerequisites
-   **Python 3.10+**
-   **Node.js 18+** & **npm**

### Quick Start (Automation)
The project includes a PowerShell script to build and run the entire stack:

```powershell
# Open terminal in project root
.\start.ps1
```
The application will be available at [http://localhost:8000](http://localhost:8000).

### Manual Startup

1.  **Build Frontend**:
    ```bash
    cd frontend
    npm install
    npm run build
    ```
2.  **Start Backend**:
    ```bash
    cd backend
    pip install -r requirements.txt # If you have a requirements.txt, or manually install dependencies
    python -m uvicorn main:app --port 8000
    ```

---

## 🐋 Deployment with Docker (VPS)

The project is optimized for deployment on a VPS using **Docker** and **Traefik** for automatic SSL/TLS.

### 1. Configure the environment
Ensure your VPS has a Docker network named `cappy-park-crm_default` (or adjust the `name` in `docker-compose.yml`).

### 2. Build and Run
Copy the project to your VPS and run:

```bash
docker-compose up --build -d
```

### 3. Verification
The app will be available at [https://allocmvp.askbel.tech](https://allocmvp.askbel.tech) with automatic SSL certificates managed by Traefik.

---

## 📂 System Records
-   **Database**: Managed via `backend/database.db`.
-   **API Documentation**: Interactive Swagger docs available at `/docs` when the server is running.
-   **Static Assets**: Production build located in `frontend/dist`.

---

> [!TIP]
> This platform is optimized for **"Internal Analytics"** and cross-team data transparency. For optimal performance, ensure all global settings (Releases/Sprints) are populated before adding allocations.

---

**TranscendCapacity** — *Beyond Resource Management.*
