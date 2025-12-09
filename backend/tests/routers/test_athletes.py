import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from pathlib import Path
from datetime import date

from main import app
from database import get_db
from crud import athlete as crud_athlete
from models import Athlete
from schemas.athlete import AthleteCreate


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db_session():
    # For testing, we might need to use a test database
    # For now, use the main db but be careful
    db = next(get_db())
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def test_athlete(db_session: Session):
    # Create a test athlete
    athlete_data = AthleteCreate(
        first_name="Test", last_name="Athlete", date_of_birth=date(1990, 1, 1)
    )
    db_athlete = crud_athlete.create_athlete(db=db_session, athlete=athlete_data)
    yield db_athlete
    # Cleanup
    db_session.delete(db_athlete)
    db_session.commit()


def test_upload_profile_picture(client: TestClient, test_athlete: Athlete):
    # Path to test image
    test_image_path = Path("test_image.jpg")

    # Ensure test image exists
    assert test_image_path.exists(), f"Test image not found at {test_image_path}"

    # Open the test image
    with open(test_image_path, "rb") as f:
        image_data = f.read()

    # Prepare form data
    files = {"profile_picture": ("test_image.jpg", image_data, "image/jpeg")}

    # Make the request
    response = client.post(
        f"/athlete/{test_athlete.athlete_id}/profile-picture", files=files
    )

    # Assert successful response
    assert response.status_code == 200

    # Parse response
    response_data = response.json()

    # Assert athlete data is returned
    assert response_data["athlete_id"] == test_athlete.athlete_id
    assert response_data["first_name"] == "Test"
    assert response_data["last_name"] == "Athlete"
    assert "profile_picture_url" in response_data
    assert response_data["profile_picture_url"] is not None

    # Assert file was saved
    picture_url = response_data["profile_picture_url"]
    assert picture_url.startswith("/static/uploads/")

    # Extract filename from URL
    filename = picture_url.replace("/static/uploads/", "")
    file_path = Path("static/uploads") / filename

    # Assert file exists
    assert file_path.exists(), f"Uploaded file not found at {file_path}"

    # Assert file content matches
    with open(file_path, "rb") as f:
        saved_data = f.read()
    assert saved_data == image_data

    # Cleanup: remove the test file
    file_path.unlink(missing_ok=True)
