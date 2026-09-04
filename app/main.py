import logging
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.database import init_db, SessionLocal
from app import models
from app.services import job_service
from app.router import jobs, profile, contacts, applications, dashboard, apply

logger = logging.getLogger("uvicorn.error")

app = FastAPI(title="Personal AI Job Search Command Center", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs.router)
app.include_router(profile.router)
app.include_router(contacts.router)
app.include_router(applications.router)
app.include_router(dashboard.router)
app.include_router(apply.router)


@app.on_event("startup")
def startup():
    init_db()
    try:
        db = SessionLocal()
        try:
            if db.query(models.Job).count() == 0:
                added = job_service.seed_from_output_files(db)
                logger.info("Seeded %s jobs from output/ on startup", added)
        finally:
            db.close()
    except Exception as exc:
        logger.warning("Startup seeding skipped: %s", exc)


@app.get("/api/health")
def health():
    return {"status": "ok", "app": "job-search-command-center"}


DIST_DIR = Path(__file__).resolve().parent.parent / "frontend" / "dist"
_ASSETS = StaticFiles(directory=DIST_DIR / "assets") if (DIST_DIR / "assets").is_dir() else None


@app.get("/{full_path:path}", include_in_schema=False)
def serve_frontend(full_path: str):
    if full_path.startswith("api/"):
        return {"detail": "Not Found"}
    if _ASSETS and full_path.startswith("assets/"):
        file = DIST_DIR / full_path
        if file.is_file():
            return FileResponse(file)
    index = DIST_DIR / "index.html"
    if index.is_file():
        return FileResponse(index)
    return {"detail": "Frontend not built. Run `npm run build` in frontend/."}
