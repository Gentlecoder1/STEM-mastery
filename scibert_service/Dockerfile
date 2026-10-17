# SciBERT inference service (CPU-only PyTorch).

# --- Stage 1: install Python dependencies -------------------------------
FROM python:3.12-slim AS builder

ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /build
COPY requirements.txt .
# CPU-only PyTorch wheel from the dedicated index avoids the ~5 GB CUDA stack.
RUN pip install --prefix=/install torch --index-url https://download.pytorch.org/whl/cpu \
 && pip install --prefix=/install fastapi uvicorn pydantic transformers safetensors

# --- Stage 2: slim runtime ----------------------------------------------
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    SCIBERT_MODEL_PATH=models/stem_scibert_final \
    SCIBERT_MIN_CONFIDENCE=0.80

WORKDIR /service
COPY --from=builder /install /usr/local
COPY app ./app
COPY models ./models

# Cloud Run injects PORT; uvicorn binds it.
EXPOSE 8080
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}
