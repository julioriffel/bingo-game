# ─────────────────────────────────────────────────────────
# Stage 1: Build Frontend (React + Vite + TypeScript)
# ─────────────────────────────────────────────────────────
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# ─────────────────────────────────────────────────────────
# Stage 2: Production Runtime (Python 3.14 + uv + FastAPI)
# ─────────────────────────────────────────────────────────
FROM python:3.14-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copy backend files and source code
COPY backend/pyproject.toml backend/.python-version backend/README.md backend/uv.lock* ./
COPY backend/src ./src

# Install backend dependencies via uv
RUN uv sync --no-dev

# Copy compiled frontend SPA assets from Stage 1 into /app/static
COPY --from=frontend-builder /app/frontend/dist ./static

ENV PATH="/app/.venv/bin:$PATH"
ENV HOST=0.0.0.0
ENV PORT=8000
EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
