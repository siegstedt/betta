import pytest
from unittest.mock import Mock, patch
from datetime import datetime, timezone
from services.strava_service import StravaService


@pytest.fixture
def mock_db():
    return Mock()


@pytest.fixture
def sample_strava_summary():
    """Sample Strava activity summary from API docs."""
    return {
        "id": 12345678987654321,
        "name": "Happy Friday",
        "distance": 28099,
        "moving_time": 4207,
        "elapsed_time": 4410,
        "total_elevation_gain": 516,
        "type": "Ride",
        "start_date": "2018-02-16T14:52:54Z",
        "average_speed": 6.679,
        "max_speed": 18.5,
        "average_cadence": 78.5,
        "average_temp": 4,
        "average_watts": 185.5,
        "max_watts": 743,
        "average_heartrate": None,  # Not present in sample
        "max_heartrate": None,
        "calories": 870.2,
    }


@pytest.fixture
def sample_strava_streams():
    """Mock streams data."""
    return {
        "time": {"data": [0, 1, 2, 3]},
        "watts": {"data": [100, 150, 200, 180]},
        "heartrate": {"data": [120, 130, 140]},  # Shorter array
        "latlng": {
            "data": [[37.83, -122.26], [37.84, -122.25], None, [37.85, -122.24]]
        },
    }


@patch("services.activity_processing.recalculate_virtual_power")
def test_map_to_betta_activity_with_sample_data(
    mock_recalc, mock_db, sample_strava_summary, sample_strava_streams
):
    """Test mapping Strava sample response to Betta Activity."""
    service = StravaService("fake_token")
    strava_data = {"summary": sample_strava_summary, "streams": sample_strava_streams}

    # Mock the recalc function
    mock_recalc.return_value = Mock()

    activity = service.map_to_betta_activity(strava_data, athlete_id=1, db=mock_db)

    # Assert summary mappings
    assert activity.athlete_id == 1
    assert activity.name == "Happy Friday"
    assert activity.sport == "cycling"  # Mapped from "Ride"
    assert activity.start_time == datetime(2018, 2, 16, 14, 52, 54, tzinfo=timezone.utc)
    assert activity.total_moving_time == 4207
    assert activity.total_elapsed_time == 4410
    assert activity.total_distance == 28099
    assert activity.average_speed == 6.679
    assert activity.max_speed == 18.5
    assert activity.average_heart_rate is None
    assert activity.max_heart_rate is None
    assert activity.average_power == 185.5
    assert activity.max_power == 743
    assert activity.total_elevation_gain == 516
    assert activity.average_cadence == 78.5
    assert activity.max_cadence is None  # Not in sample
    assert activity.total_calories == 870.2

    # Assert records from streams
    assert len(activity.records) == 4
    assert activity.records[0].power == 100
    assert activity.records[0].heart_rate == 120
    assert activity.records[0].latitude == 37.83
    assert activity.records[0].longitude == -122.26

    assert activity.records[1].power == 150
    assert activity.records[1].heart_rate == 130
    assert activity.records[1].latitude == 37.84
    assert activity.records[1].longitude == -122.25

    assert activity.records[2].power == 200
    assert activity.records[2].heart_rate == 140  # Shorter array, but padded
    assert activity.records[2].latitude is None  # None in data
    assert activity.records[2].longitude is None

    assert activity.records[3].power == 180
    assert activity.records[3].heart_rate is None
    assert activity.records[3].latitude == 37.85
    assert activity.records[3].longitude == -122.24

    # Ensure recalc was called
    mock_recalc.assert_called_once()


def test_sport_mapping():
    """Test Strava sport type to Betta sport mapping."""
    service = StravaService("fake_token")

    # Test various mappings
    test_cases = [
        ("Ride", "cycling"),
        ("Run", "run"),
        ("Swim", "swim"),
        ("Hike", "hike"),
        ("Unknown", "cycling"),  # Default
    ]

    for strava_type, expected_betta in test_cases:
        with patch("services.activity_processing.recalculate_virtual_power"):
            activity = service.map_to_betta_activity(
                {
                    "summary": {
                        "type": strava_type,
                        "start_date": "2018-02-16T14:52:54Z",
                    },
                    "streams": {"time": {"data": []}},
                },
                athlete_id=1,
                db=Mock(),
            )
            assert activity.sport == expected_betta
