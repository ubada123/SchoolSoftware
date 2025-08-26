# School Admin (Students, Classes, Attendance, Grades)

Full-stack app:
- Backend: Django + DRF + JWT
- Frontend: React (Vite) + Tailwind
- DB: SQLite (dev) / Postgres (Docker)
- Docker: Backend (Gunicorn), Frontend (Nginx), Postgres, Traefik (HTTPS)

## Local development

Prereqs: Python 3.11+ and Node 18+ (or newer)

```bash
# Backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser  # optional
python manage.py runserver
# Backend runs on http://localhost:8000

# Frontend
cd web
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

Login to the app using the Django admin credentials you created or the pre-seeded admin if available.

## API (JWT)

- Obtain token: POST `/api/auth/token/` with JSON body `{ "username": "admin", "password": "<password>" }`.
- Use `Authorization: Bearer <access>` for API requests.
- Key endpoints:
  - `/api/classrooms/` CRUD
  - `/api/students/` CRUD
  - `/api/attendance/` CRUD
  - `/api/grades/` CRUD

## Docker (http)

Build and run with Postgres, Backend, Frontend:

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:8000 (inside compose network exposed via Traefik later for HTTPS)

To stop:
```bash
docker compose down
```

## HTTPS with Traefik + Let’s Encrypt

Requirements:
- Public server with ports 80/443 open
- DNS A records pointing to the server
  - FRONTEND_HOST → app.yourschool.com
  - BACKEND_HOST → api.yourschool.com (or route `/api` under frontend host)

Start with env variables (replace placeholders):
```bash
LE_EMAIL=you@example.com \
FRONTEND_HOST=app.yourschool.com \
BACKEND_HOST=api.yourschool.com \
  docker compose up -d --build
```

Behavior:
- `https://app.yourschool.com` serves the React SPA
- `https://api.yourschool.com` and `https://app.yourschool.com/api/...` route to Django API
- Certificates auto-issued/renewed via Let’s Encrypt (Traefik)

Notes:
- Django settings use environment variables for DB/CORS/hosts in production (`server/settings.py`).
- For single-domain setup, you can point both frontend and API to the same host; API will be available under `/api` path.

## CSV import/export

- Students page: Import CSV with headers `first_name,last_name,date_of_birth,roll_number,class,section`. Missing classrooms are auto-created. Download a sample from the page.
- Grades page: Import CSV with headers `roll_number,subject,term,score,max_score` (or `student/name` instead of roll). Export is available on the page.

## Common commands

```bash
# Apply DB migrations in Docker
docker compose exec backend python manage.py migrate

# Create superuser in Docker
docker compose exec -it backend python manage.py createsuperuser

# Tail backend logs
docker compose logs -f backend

# Rebuild frontend only
docker compose build frontend && docker compose up -d frontend
```

## Project structure

- `server/` Django project (settings, urls)
- `core/` Django app (models, serializers, viewsets)
- `web/` React app (Vite)
- `Dockerfile.backend`, `Dockerfile.frontend`, `docker-compose.yml`
- `nginx.conf` (frontend container), `traefik_dynamic.yml` (Traefik)

## Roadmap

- Attendance UI
- Role-based permissions (Teacher/Admin/Read-only)
- Reporting dashboards
- Backups and monitoring
