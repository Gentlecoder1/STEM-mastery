# STEM Mastery — Backend

FastAPI backend for the STEM Mastery React Native app. Uses [uv](https://docs.astral.sh/uv/) for
dependency management and virtual environments.

## Requirements

- Python 3.11+
- [uv](https://docs.astral.sh/uv/getting-started/installation/)

## Setup

```powershell
cd backend
uv sync
```

## Run (development, with autoreload)

```powershell
uv run fastapi dev app/main.py
```

- API root: http://127.0.0.1:8000/
- Interactive docs: http://127.0.0.1:8000/docs

## Run (production)

```powershell
uv run fastapi run app/main.py
```

## Test

```powershell
uv run pytest
```

## Lint / format

```powershell
uv run ruff check .
uv run ruff format .
```

## Configuration

Settings are read from environment variables prefixed with `STEM_` (and from a local `.env`).
Copy `.env.example` to `.env` and fill in your Neo4j AuraDB credentials. The graph is the
authoritative source for the curriculum; access is **read-only**.

| Variable | Purpose |
| --- | --- |
| `STEM_ENV` | `development` enables `GET /api/v1/graph/schema` |
| `STEM_API_PREFIX` | API prefix (default `/api/v1`) |
| `STEM_NEO4J_URI` | Aura connection URI (`neo4j+s://...`) |
| `STEM_NEO4J_USER` | Aura username |
| `STEM_NEO4J_PASSWORD` | Aura password |
| `STEM_NEO4J_DATABASE` | Aura database name |

Leave `STEM_NEO4J_URI` blank to boot without a database: catalog endpoints return `503`.

## API

All routes are mounted under `STEM_API_PREFIX` (default `/api/v1`).

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Liveness |
| GET | `/subjects` | List subjects |
| GET | `/subjects/{id}/topics` | Topics of a subject |
| GET | `/topics/{id}/concepts` | Concepts of a topic |
| GET | `/concepts/{id}` | Concept detail (definition, prerequisites, related, content, questions) |
| GET | `/concepts/{id}/content` | Learning content for a concept |
| GET | `/concepts/{id}/questions` | Questions for a concept (answers withheld) |
| GET | `/graph/schema` | Dev-only labels/relationships/property keys |

Correct answers are never returned to clients; grading is server-side.

## Project layout

```
backend/
├── app/
│   ├── main.py              # FastAPI app + lifespan + middleware + routers
│   ├── api/
│   │   ├── deps.py          # dependency injection (db, repository)
│   │   └── routes/          # route modules (one per resource)
│   ├── core/
│   │   ├── config.py        # settings (pydantic-settings)
│   │   └── db.py            # async Neo4j driver (read-only)
│   ├── models/              # pydantic response models
│   └── repositories/        # read-only Cypher queries
├── tests/                   # pytest tests (fake repo; live tests are env-gated)
└── pyproject.toml           # deps + tool config
```
