import logging
import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api import (
    admin_dashboard, admin_users, appointments, auth, content, design_approval,
    documents, enquiries, messages, notifications, projects, services, settings as settings_api,
    uploads,
)
from app.config.settings import get_settings
from app.middleware.error_handlers import register_error_handlers
from app.middleware.rate_limit import limiter

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    description="API for a premium interior design studio platform — public site, "
    "customer project portal and admin back office.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# --- Rate limiting ---
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request, exc):
    from fastapi.responses import JSONResponse

    return JSONResponse(status_code=429, content={"error": {"message": "Too many requests. Please slow down.", "code": 429}})


# --- Compression: JSON list endpoints compress well ---
app.add_middleware(GZipMiddleware, minimum_size=1000)


# --- Security headers on every API response ---
@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Cache-Control"] = response.headers.get("Cache-Control", "no-store")
    if settings.ENV == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# --- Slow request logging: surfaces N+1s and missing indexes in production ---
@app.middleware("http")
async def log_slow_requests(request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    response.headers["X-Response-Time-Ms"] = f"{duration_ms:.0f}"
    if duration_ms > 1000:
        logging.getLogger("app.perf").warning(
            "Slow request: %s %s took %.0fms", request.method, request.url.path, duration_ms
        )
    return response


# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Error handling ---
register_error_handlers(app)

# --- Static file serving for locally-stored (non-sensitive/public) assets ---
app.mount("/media", StaticFiles(directory=settings.LOCAL_STORAGE_PATH), name="media")

# --- Routers ---
API = settings.API_V1_PREFIX

app.include_router(auth.router, prefix=API)
app.include_router(services.router, prefix=API)
app.include_router(services.admin_router, prefix=API)
app.include_router(projects.router, prefix=API)
app.include_router(projects.portal_router, prefix=API)
app.include_router(projects.admin_router, prefix=API)
app.include_router(enquiries.router, prefix=API)
app.include_router(enquiries.admin_router, prefix=API)
app.include_router(appointments.router, prefix=API)
app.include_router(appointments.admin_router, prefix=API)
app.include_router(content.router, prefix=API)
app.include_router(content.admin_testimonials_router, prefix=API)
app.include_router(content.admin_blog_router, prefix=API)
app.include_router(content.admin_faq_router, prefix=API)
app.include_router(content.admin_contact_router, prefix=API)
app.include_router(settings_api.router, prefix=API)
app.include_router(settings_api.admin_router, prefix=API)
app.include_router(documents.router, prefix=API)
app.include_router(design_approval.admin_router, prefix=API)
app.include_router(design_approval.portal_router, prefix=API)
app.include_router(messages.router, prefix=API)
app.include_router(notifications.router, prefix=API)
app.include_router(admin_dashboard.router, prefix=API)
app.include_router(admin_users.router, prefix=API)
app.include_router(uploads.router, prefix=API)
app.include_router(uploads.admin_gallery_router, prefix=API)


@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": settings.APP_NAME}
