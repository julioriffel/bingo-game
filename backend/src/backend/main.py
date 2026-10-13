import os
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response
from .config import settings
from .services.redis_service import redis_service
from .routers import rooms, websockets

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Iniciando Bingo Backend (Python 3.14 + FastAPI + WebSockets)...")
    await redis_service.connect()
    yield
    logger.info("Encerrando Bingo Backend...")
    await redis_service.close()

app = FastAPI(
    title="Bingo Multiplayer API",
    description="Backend em tempo real com FastAPI, WebSockets e Redis para Bingo 75 bolas.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(rooms.router)
app.include_router(websockets.router)

@app.api_route("/health", methods=["GET", "HEAD"])
@app.api_route("/api/health", methods=["GET", "HEAD"])
def health_check():
    return {
        "status": "healthy",
        "redis_connected": redis_service.is_connected,
        "engine": "Bingo 75",
        "python_version": "3.14",
    }

# SPA Static Files Serving for Production Single-Container
static_dir = Path(__file__).resolve().parent.parent.parent / "static"
if not static_dir.exists():
    static_dir = Path("static")

if static_dir.exists():
    assets_dir = static_dir / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.api_route("/{full_path:path}", methods=["GET", "HEAD"])
    async def serve_spa(full_path: str):
        if full_path.startswith("api") or full_path.startswith("ws"):
            return Response(status_code=404)
        target = static_dir / full_path
        if target.is_file():
            return FileResponse(target)
        index = static_dir / "index.html"
        if index.is_file():
            return FileResponse(index)
        return Response(status_code=404)

def main():
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True
    )

if __name__ == "__main__":
    main()
