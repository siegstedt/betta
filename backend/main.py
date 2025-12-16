from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import models
from database import engine
from routers import athletes, activities, performance, equipment, strava

# This command ensures that all tables are created in the database
# based on the models defined in models.py when the application starts.
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Betta API",
    description="API for the Betta training and performance analysis platform.",
    version="0.1.0",
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Set up CORS (Cross-Origin Resource Sharing)
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://host.docker.internal:3000",
    "http://host.docker.internal:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Include routers from the routers module
app.include_router(athletes.router)
app.include_router(activities.router)
app.include_router(performance.router)
app.include_router(equipment.router)
app.include_router(strava.router)
