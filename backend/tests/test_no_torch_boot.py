"""Guards the serverless constraint: the API must boot with the ML stack blocked.

Vercel function bundles break above the size limit, so backend deps must stay
free of torch/transformers/safetensors. A subprocess installs a meta-path
blocker that raises on any attempt to import those packages, then imports the
whole API surface — proving that nothing on the import path pulls them in.
"""

from __future__ import annotations

import subprocess
import sys
import textwrap
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]

BLOCKER_SCRIPT = textwrap.dedent(
    """
    import sys

    class _MLBlocker:
        blocked = {"torch", "transformers", "safetensors", "tokenizers"}

        def find_spec(self, fullname, path=None, target=None):
            if fullname.split(".")[0] in self.blocked:
                raise ImportError(f"{fullname} is forbidden in the serverless bundle")
            return None

    sys.meta_path.insert(0, _MLBlocker())

    import app.main  # whole API surface, DI graph included
    from app.api.deps import _build_semantic_extractor
    from app.services.remote_scibert_service import RemoteSciBERTExtractor
    assert _build_semantic_extractor() is not None
    """
)


def test_backend_boots_without_torch_or_transformers() -> None:
    result = subprocess.run(
        [sys.executable, "-c", BLOCKER_SCRIPT],
        cwd=BACKEND_ROOT,
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, result.stderr
