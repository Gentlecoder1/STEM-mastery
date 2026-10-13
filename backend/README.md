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
Copy `.env.example` to `.env` to get started.

## Project layout

```
backend/
├── app/
│   ├── main.py            # FastAPI app + middleware + routers
│   ├── api/routes/        # route modules (one per resource)
│   └── core/config.py     # settings (pydantic-settings)
├── tests/                 # pytest tests
└── pyproject.toml         # deps + tool config
```
