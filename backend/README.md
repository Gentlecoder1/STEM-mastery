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

## Deploy to Vercel

The backend is serverless-ready and deploys as a single ASGI function. It starts
successfully **without** Neo4j configured; graph endpoints then answer `503`
instead of crashing, so you can ship now and add AuraDB later.

Files added for Vercel:

- `api/index.py` — exposes the FastAPI ASGI `app` to Vercel's Python runtime.
- `vercel.json` — rewrites every path to `api/index.py`.
- `requirements.txt` — lean runtime-only dependency list (no CLI/dev extras).

To deploy:

1. From the `backend/` directory, run `vercel` (or point the Vercel project's root
   directory at `backend/`).
2. Set the environment variables in Vercel (Project → Settings → Environment
   Variables). Leave the `STEM_NEO4J_*` values blank until AuraDB is ready:

   | Variable | Value |
   | --- | --- |
   | `STEM_ENV` | `production` |
   | `STEM_API_PREFIX` | `/api/v1` |
   | `STEM_CORS_ORIGINS` | `["https://your-app-origin"]` |
   | `STEM_SUPABASE_URL` | Supabase project URL |
   | `STEM_SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server-only) |
   | `STEM_NEO4J_URI` | _(empty until AuraDB exists)_ |
   | `STEM_NEO4J_USER` | _(empty until AuraDB exists)_ |
   | `STEM_NEO4J_PASSWORD` | _(empty until AuraDB exists)_ |
3. Deploy. `GET /health` should return `200`; `GET /api/v1/subjects` returns
   `503` until `STEM_NEO4J_*` are set.
4. When AuraDB is available, fill in the `STEM_NEO4J_*` values and redeploy.
   No code change is required — connection details are fully environment-driven.

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

Leave `STEM_NEO4J_URI` blank to boot without a database: catalog endpoints return `503`. If Neo4j is configured but unreachable, graph endpoints also return `503` (never a crash). No mock curriculum is ever served as a fallback.

## API

All routes are mounted under `STEM_API_PREFIX` (default `/api/v1`).

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Liveness |
| GET | `/subjects` | List subjects |
| GET | `/subjects/{id}/topics` | Topics of a subject |
| GET | `/topics/{id}/concepts` | Concepts of a topic |
| GET | `/concepts/{id}` | Concept metadata and graph relationships |
| GET | `/concepts/{id}/lesson` | Structured V3 lesson (practice questions remain separate) |
| GET | `/concepts/{id}/questions` | Questions for a concept (answers withheld) |
| GET | `/graph/schema` | Dev-only labels/relationships/property keys |

Correct answers are never returned to clients; grading is server-side.

The V3 lesson endpoint reads one `LearningContent` node connected to a canonical
`Concept` by `HAS_CONTENT`. In the seeder format, each pedagogical item is its
own `LearningContent` node; `type`, `chapterOrder`, and `order` preserve the
section/item sequence, and rich objects are JSON-encoded in `contentData`.
Both nodes must have `structureVersion = "v3-json"`; the concept must also have
`canonical = true` and lesson nodes must be `learnerFacing`. Lesson fields are
projected explicitly, so ingestion metadata and authoring fields are not
returned. The API orders content by
`coalesce(lc.chapterOrder, 0), coalesce(lc.order, 0), lc.contentID`, then
assembles each content type into the structured response. Graph prerequisites use
`(:Concept)-[:PREREQUISITE_OF]->(:Concept)` and questions are fetched separately.
Concepts without learner-facing V3 lesson nodes return `404` from
`/concepts/{id}/lesson`.

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
