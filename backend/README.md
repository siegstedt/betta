# Backend README

## Overview
This is the backend for the Betta training and performance analysis platform, built with FastAPI. It provides APIs for managing athletes, activities, performance data, and equipment.

## Setup
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set up the database:
   - Ensure PostgreSQL is running.
   - Set the `DATABASE_URL` environment variable (default: `postgresql://user:password@localhost:5432/db`).

## Running the Application
- For development: `uvicorn main:app --reload`
- With Docker: Use the root `docker-compose up --build` for the full stack.

The API will be available at `http://localhost:8000`.

## Testing
Run tests with:
```bash
pytest
```

For a specific test: `pytest <path_to_test_file>::<test_function_name>`

## Code Style
- Lint: `ruff check .`
- Format: `ruff format .`

## Project Structure
- `main.py`: FastAPI app entry point.
- `database.py`: Database configuration.
- `models/`: SQLAlchemy models.
- `schemas/`: Pydantic schemas.
- `routers/`: API route handlers.
- `services/`: Business logic services.