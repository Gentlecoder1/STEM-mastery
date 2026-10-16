"""Vercel serverless entrypoint.

Exposes the FastAPI ASGI application to Vercel's Python runtime. ``vercel.json``
rewrites every path to this function. The application boots successfully even
when Neo4j is not configured; graph-dependent endpoints then return 503.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Make the project root (which contains the ``app`` package) importable when this
# file is executed as ``api/index.py`` on Vercel.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app  # noqa: E402

__all__ = ["app"]
