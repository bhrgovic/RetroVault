# RetroVault

[![CI/CD](https://github.com/bhrgovic/RetroVault/actions/workflows/ci.yml/badge.svg)](https://github.com/bhrgovic/RetroVault/actions/workflows/ci.yml)

A containerized, self-hosted service for cataloguing a retro game collection. Each user keeps a private library of games with cover art, ROM files and multiple save states per title.

Built as the project for **Applied DevOps** at Algebra University College — the application is a vehicle for the DevOps practices around it: containerization, CI/CD on GitHub Actions, artifact publishing to GHCR, automated testing, and Prometheus/Grafana monitoring.

## Architecture

```
                        ┌──────────────┐
   browser ────────────▶│   frontend   │  React 19 + Vite, served by Nginx
                        │   :5173      │
                        └──────┬───────┘
                               │ REST + JWT
                        ┌──────▼───────┐        ┌──────────────┐
                        │   backend    │───────▶│  PostgreSQL  │
                        │   :8000      │        │    :5432     │
                        │  FastAPI     │        └──────────────┘
                        └──────┬───────┘
                               │ /metrics
                        ┌──────▼───────┐        ┌──────────────┐
                        │  Prometheus  │───────▶│   Grafana    │
                        │    :9090     │        │    :3001     │
                        └──────────────┘        └──────────────┘
```

Two deployable application services (backend, frontend) plus a database and the monitoring pair, all orchestrated with Docker Compose.

## Services

| Service | Image / build | Host port | Purpose |
|---|---|---|---|
| `frontend` | `./frontend` | 5173 → 80 | React SPA behind Nginx |
| `backend` | `./backend` | 8000 | FastAPI REST API, JWT auth, file uploads |
| `db` | `postgres:15` | 5432 | Application database |
| `prometheus` | `prom/prometheus` | 9090 | Scrapes `backend:8000/metrics` every 5s |
| `grafana` | `grafana/grafana` | 3001 → 3000 | Dashboards over Prometheus |

## Running it

Requires Docker and Docker Compose.

```bash
docker compose build
docker compose up
```

Then open:

- Application — http://localhost:5173
- API docs (Swagger) — http://localhost:8000/docs
- Prometheus — http://localhost:9090
- Grafana — http://localhost:3001 (default login `admin` / `admin`)

To stop, and to also drop the database volume:

```bash
docker compose down
docker compose down -v
```

## Configuration

| Variable | Service | Default | Notes |
|---|---|---|---|
| `DATABASE_URL` | backend | `postgresql://retro:retro@db:5432/retrovault` | Set in `docker-compose.yml` |
| `SECRET_KEY` | backend | `supersecretkey` | JWT signing key — override outside development |
| `VITE_API_URL` | frontend | `http://localhost:8000` | Baked in at build time via `frontend/.env` |

## API

Authentication is JWT bearer; obtain a token from `/auth/login` and send it as `Authorization: Bearer <token>`.

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/register` | Create an account |
| `POST` | `/auth/login` | Exchange credentials for an access token |
| `GET` | `/games/` | List the current user's games |
| `POST` | `/games/` | Create a game |
| `GET` | `/games/{id}` | Fetch one game with its save files |
| `PUT` | `/games/{id}` | Update game metadata |
| `DELETE` | `/games/{id}` | Delete a game and its files |
| `POST` | `/games/{id}/upload` | Upload a `rom`, a `save`, and/or cover `art` |
| `DELETE` | `/games/{id}/art` | Remove the cover art |
| `DELETE` | `/games/saves/{save_id}` | Delete one save file |
| `GET` | `/metrics` | Prometheus exposition format |

Uploaded files are written to `backend/uploads/` (bind-mounted, so they survive container restarts) and served statically from `/uploads`. Cover art accepts `.png`, `.jpg`, `.jpeg`, `.webp` and `.gif` up to 5 MB.

## Project structure

```
backend/
  app/
    main.py          FastAPI app, CORS, static uploads, Prometheus instrumentation
    models.py        SQLAlchemy models: User, Game, SaveFile
    schemas.py       Pydantic request/response models
    auth.py          Password hashing and JWT issuing
    deps.py          Database session and current-user dependencies
    routes/          users.py (auth), games.py (library and uploads)
    tests/           pytest suite
  Dockerfile
frontend/
  src/
    pages/           Login, Register, Games, AddGame, GameDetail
    components/      Navbar
  Dockerfile         Multi-stage: Node build → Nginx runtime
monitoring/
  prometheus.yml     Scrape configuration
.github/workflows/
  ci.yml             Test pipeline and GHCR image publishing
```

## Development

Backend:

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=postgresql://retro:retro@localhost:5432/retrovault
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Testing

```bash
cd backend && pytest          # API tests against a live database
cd frontend && npm run test   # Vitest + Testing Library component tests
```

The backend suite runs on every push and pull request against `main`, using a Postgres service container, and gates the image build and push.

## Pipeline

`ci.yml` defines two jobs:

- **ci** — installs dependencies, runs `pytest` against Postgres, uploads the JUnit report as a build artifact.
- **cd** — depends on `ci`; logs into GHCR and pushes the backend image tagged `latest` and with the commit SHA.

## Known limitations

- Schema changes are applied by `Base.metadata.create_all`, which creates missing tables but never alters existing ones. Adding a column to a database that already exists requires a manual `ALTER TABLE` or dropping the volume. A migration tool is the correct fix.
- Uploaded files are served without authentication; anyone who knows a file path can read it.
- `SECRET_KEY` and the database password are committed in `docker-compose.yml` for ease of local setup.
