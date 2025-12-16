import requests
import os
from datetime import datetime, timedelta
from typing import Dict, Any
from sqlalchemy.orm import Session

import models
from . import activity_processing


class StravaService:
    BASE_URL = "https://www.strava.com/api/v3"

    def __init__(self, access_token: str):
        self.access_token = access_token

    def get_activity_streams(self, activity_id: int) -> Dict[str, Any]:
        """Fetch activity streams from Strava."""
        url = f"{self.BASE_URL}/activities/{activity_id}/streams"
        params = {"keys": "time,watts,heartrate,latlng,moving", "key_by_type": True}
        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()

    def get_activity_summary(self, activity_id: int) -> Dict[str, Any]:
        """Fetch activity summary from Strava."""
        url = f"{self.BASE_URL}/activities/{activity_id}"
        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()

    def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token using refresh token."""
        client_id = os.getenv("STRAVA_CLIENT_ID")
        client_secret = os.getenv("STRAVA_CLIENT_SECRET")
        if not client_id or not client_secret:
            raise ValueError("Strava credentials not configured")

        response = requests.post(
            "https://www.strava.com/oauth/token",
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
        )
        response.raise_for_status()
        return response.json()

    def map_to_betta_activity(
        self, strava_data: Dict[str, Any], athlete_id: int, db: Session
    ) -> models.Activity:
        """Map Strava data to Betta Activity."""
        summary = strava_data["summary"]
        streams = strava_data["streams"]

        activity = models.Activity(
            athlete_id=athlete_id,
            name=summary.get("name", "Strava Activity"),
            sport=summary.get("type", "cycling").lower(),
            start_time=datetime.fromisoformat(
                summary["start_date"].replace("Z", "+00:00")
            ),
            total_moving_time=summary.get("moving_time", 0),
            total_distance=summary.get("distance", 0),
            average_speed=summary.get("average_speed", 0),
            average_heart_rate=summary.get("average_heartrate"),
            max_heart_rate=summary.get("max_heartrate"),
            average_power=summary.get("average_watts"),
            max_power=summary.get("max_watts"),
            total_elevation_gain=summary.get("total_elevation_gain", 0),
            average_cadence=summary.get("average_cadence"),
            max_cadence=summary.get("max_cadence"),
        )

        # Add records from streams
        if "watts" in streams:
            watts = streams["watts"]["data"]
        else:
            watts = [0] * len(streams["time"]["data"])
        heartrate = streams.get("heartrate", {}).get("data", [])
        latlng = streams.get("latlng", {}).get("data", [])
        time_data = streams["time"]["data"]

        for i, timestamp in enumerate(time_data):
            record = models.ActivityRecord(
                activity_id=activity.activity_id,
                timestamp=activity.start_time + timedelta(seconds=timestamp),
                power=watts[i] if i < len(watts) else None,
                heart_rate=heartrate[i] if i < len(heartrate) else None,
                latitude=latlng[i][0] if i < len(latlng) else None,
                longitude=latlng[i][1] if i < len(latlng) else None,
            )
            activity.records.append(record)

        # Calculate derived metrics
        activity_processing.recalculate_virtual_power(
            db, activity, 0
        )  # Assume no trainer

        return activity
