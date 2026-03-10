from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from database import engine, Base
from routers import auth, health, behavioral, wearable, voice, risk, analytics

# Create database tables
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown
    pass

app = FastAPI(
    title="MindSense API",
    description="Real-Time Mental Health Early-Warning System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["Health"])
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(behavioral.router, prefix="/behavioral", tags=["Behavioral Data"])
app.include_router(wearable.router, prefix="/wearable", tags=["Wearable Data"])
app.include_router(voice.router, prefix="/voice", tags=["Voice Analysis"])
app.include_router(risk.router, prefix="/risk", tags=["Risk Prediction"])
app.include_router(analytics.router, prefix="/analytics", tags=["Admin Analytics"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
