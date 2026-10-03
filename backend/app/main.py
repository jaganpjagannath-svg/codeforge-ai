import os
import sys
from pathlib import Path
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from app.config import settings
from app.database import engine, Base
from app.seed import seed_database
from app.exceptions import AppException
from app.logger import app_logger

# Import routers
from app.routes.auth import router as auth_router
from app.routes.languages import router as languages_router
from app.routes.questions import router as questions_router
from app.routes.code import router as code_router
from app.routes.ai import router as ai_router
from app.routes.tests import router as tests_router
from app.routes.dashboard import router as dashboard_router
from app.routes.search import router as search_router
from app.routes.admin import router as admin_router
from app.routes.settings import router as settings_router

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handlers (Standardized JSON Responses)
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    app_logger.warning(f"AppException: {exc.code} - {exc.message} on {request.url.path}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details
            }
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Normalize Pydantic validation errors into clean human-readable messages
    errors = exc.errors()
    msg = "Please check the entered information."
    if errors:
        first = errors[0]
        field = first.get("loc", ["field"])[-1]
        raw_msg = first.get("msg", "")
        if "email" in str(field).lower():
            msg = "Please enter a valid email address."
        elif "password" in str(field).lower():
            if "at least 8" in raw_msg or "match" in raw_msg:
                msg = raw_msg
            else:
                msg = "Password must contain at least 8 characters."
        else:
            msg = f"{str(field).capitalize()}: {raw_msg}"

    app_logger.warning(f"ValidationError on {request.url.path}: {msg}")
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": msg
            }
        }
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    msg = str(exc.detail) if exc.detail else "Request failed."
    app_logger.warning(f"HTTPException {exc.status_code} on {request.url.path}: {msg}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": msg
            }
        }
    )

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    app_logger.error(f"Unhandled Exception on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "SERVER_ERROR",
                "message": "We couldn't complete your request. Please try again."
            }
        }
    )

# Register API Routers
app.include_router(auth_router)
app.include_router(languages_router)
app.include_router(questions_router)
app.include_router(code_router)
app.include_router(ai_router)
app.include_router(tests_router)
app.include_router(dashboard_router)
app.include_router(search_router)
app.include_router(admin_router)
app.include_router(settings_router)

# Lightweight Healthcheck for Render & Monitoring
@app.get("/health")
def health():
    return {
        "success": True,
        "status": "healthy"
    }

# Detailed Healthcheck
@app.get("/api/health")
def healthcheck():
    return {
        "success": True,
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION
    }

# Startup hook
@app.on_event("startup")
def on_startup():
    try:
        seed_database()
    except Exception as e:
        app_logger.error(f"Startup seed notice: {e}")

# Static Frontend mounting
frontend_path = settings.FRONTEND_DIR
if frontend_path.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_path)), name="static")

    # SPA catch-all route for frontend routes
    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        file_target = frontend_path / full_path
        if full_path and file_target.is_file():
            return FileResponse(str(file_target))
        index_file = frontend_path / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return JSONResponse({"success": False, "message": "Frontend not found."}, status_code=404)
