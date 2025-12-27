import requests
import os
from datetime import datetime, timedelta
from typing import Dict, Any
from sqlalchemy.orm import Session

import models
import crud
from . import activity_processing, calculations


class StravaService:
    BASE_URL = "https://www.strava.com/api/v3"

    def __init__(self, access_token: str):
        self.access_token = access_token

    def get_activity_streams(self, activity_id: int) -> Dict[str, Any]:
        """Fetch activity streams from Strava."""
        url = f"{self.BASE_URL}/activities/{activity_id}/streams"
        params = {"keys": "time,watts,heartrate,latlng,moving,cadence,velocity_smooth,altitude", "key_by_type": True}
        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        streams = response.json()
        # Log stream availability
        available_streams = list(streams.keys())
        print(f"Fetched streams for activity {activity_id}: {available_streams}")
        if 'altitude' not in available_streams:
            print(f"Altitude stream not available for activity {activity_id}")
        return streams

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

        # Map Strava sport types to Betta sports
        sport_mapping = {
            "Ride": "cycling",
            "Run": "run",
            "Swim": "swim",
            "Hike": "hike",
            "Walk": "walk",
            "AlpineSki": "ski",
            "BackcountrySki": "ski",
            "Canoeing": "other",
            "Crossfit": "gym",
            "EBikeRide": "cycling",
            "Elliptical": "other",
            "Golf": "other",
            "Handcycle": "cycling",
            "IceSkate": "other",
            "InlineSkate": "other",
            "Kayaking": "other",
            "Kitesurf": "other",
            "NordicSki": "ski",
            "RockClimbing": "other",
            "RollerSki": "ski",
            "Rowing": "other",
            "Snowboard": "ski",
            "Snowshoe": "walk",
            "Soccer": "other",
            "StairStepper": "other",
            "StandUpPaddling": "other",
            "Surfing": "other",
            "Velomobile": "cycling",
            "VirtualRide": "cycling",
            "VirtualRun": "run",
            "WeightTraining": "gym",
            "Wheelchair": "other",
            "Windsurf": "other",
            "Workout": "gym",
            "Yoga": "yoga",
        }
        betta_sport = sport_mapping.get(summary.get("type", "Ride"), "cycling")

        activity = models.Activity(
            athlete_id=athlete_id,
            name=summary.get("name", "Strava Activity"),
            sport=betta_sport,
            start_time=datetime.fromisoformat(
                summary["start_date"].replace("Z", "+00:00")
            ),
            total_moving_time=summary.get("moving_time", 0),
            total_elapsed_time=summary.get("elapsed_time", 0),
            total_distance=summary.get("distance", 0),
            average_speed=summary.get("average_speed", 0),
            max_speed=summary.get("max_speed"),
            average_heart_rate=summary.get("average_heartrate"),
            max_heart_rate=summary.get("max_heartrate"),
            average_power=summary.get("average_watts"),
            max_power=summary.get("max_watts"),
            total_elevation_gain=summary.get("total_elevation_gain", 0),
            average_cadence=summary.get("average_cadence"),
            max_cadence=summary.get("max_cadence"),
            total_calories=summary.get("calories"),
            source='strava',
            strava_activity_id=summary["id"],
        )

        # Add records from streams
        time_data = streams.get("time", {}).get("data", [])
        if not time_data:
            # No time stream, cannot create records
            pass
        else:
            watts_data = streams.get("watts", {}).get("data", [])
            watts = watts_data + [None] * (len(time_data) - len(watts_data))
            heartrate_data = streams.get("heartrate", {}).get("data", [])
            heartrate = heartrate_data + [None] * (len(time_data) - len(heartrate_data))
            latlng_data = streams.get("latlng", {}).get("data", [])
            latlng = latlng_data + [None] * (len(time_data) - len(latlng_data))
            cadence_data = streams.get("cadence", {}).get("data", [])
            cadence = cadence_data + [None] * (len(time_data) - len(cadence_data))
            velocity_smooth_data = streams.get("velocity_smooth", {}).get("data", [])
            velocity_smooth = velocity_smooth_data + [None] * (len(time_data) - len(velocity_smooth_data))
            altitude_data = streams.get("altitude", {}).get("data", [])
            altitude = altitude_data + [None] * (len(time_data) - len(altitude_data))

            power_data = []
            for i, timestamp in enumerate(time_data):
                power_value = watts[i] if watts[i] is not None else None
                if power_value is not None:
                    power_data.append(power_value)
                record = models.ActivityRecord(
                    activity_id=activity.activity_id,
                    timestamp=activity.start_time + timedelta(seconds=timestamp),
                    power=power_value,
                    heart_rate=heartrate[i] if heartrate[i] is not None else None,
                    cadence=cadence[i] if cadence[i] is not None else None,
                    speed=velocity_smooth[i] if velocity_smooth[i] is not None else None,
                    latitude=latlng[i][0] if latlng[i] is not None else None,
                    longitude=latlng[i][1] if latlng[i] is not None else None,
                    altitude=altitude[i] if altitude[i] is not None else None,
                )
                activity.records.append(record)

            # Calculate normalized power if power data available
            if power_data:
                activity.normalized_power = calculations.calculate_normalized_power(power_data)

        # Process laps from Strava activity summary
        laps_data = summary.get("laps", [])
        for lap_idx, lap in enumerate(laps_data):
            lap_record = models.ActivityLap(
                activity_id=activity.activity_id,
                lap_number=lap_idx + 1,
                duration=lap.get("elapsed_time"),
                distance=lap.get("distance"),
                average_power=lap.get("average_watts"),
                total_elevation_gain=lap.get("total_elevation_gain"),
                average_speed=lap.get("average_speed"),
                average_cadence=lap.get("average_cadence"),
                average_heart_rate=lap.get("average_heartrate"),
            )
            # Note: Strava lap data doesn't include per-point altitude, only elevation gain
            activity.laps.append(lap_record)

        # Calculate derived metrics
        activity_processing.recalculate_virtual_power(
            db, activity, 0
        )  # Assume no trainer

        # Calculate training load metrics
        athlete = db.query(models.Athlete).filter(models.Athlete.athlete_id == activity.athlete_id).first()
        if athlete:
            # Calculate TSS if normalized power available
            if activity.normalized_power and activity.total_moving_time:
                ftp_metric = crud.get_latest_ftp(db, athlete.athlete_id)
                if ftp_metric:
                    ftp = ftp_metric.value
                    if ftp > 0:
                        activity.tss = calculations.calculate_tss(
                            normalized_power=activity.normalized_power,
                            ftp=ftp,
                            duration_seconds=activity.total_moving_time
                        )
                        activity.intensity_factor = activity.normalized_power / ftp
                    else:
                        print(f"Invalid FTP value ({ftp}) for athlete {athlete.athlete_id}, skipping TSS calculation")
                else:
                    print(f"No FTP metric found for athlete {athlete.athlete_id}, skipping TSS calculation")

            # Note: TRIMP calculation requires zone analysis, skipping for now

            # Calculate unified training load
            if activity.tss and activity.tss > 0:
                activity.unified_training_load = activity.tss
            else:
                activity.unified_training_load = 0

        return activity

    def get_athlete_activities(self, page: int = 1, per_page: int = 30) -> list[Dict[str, Any]]:
        """Fetch paginated list of athlete activities from Strava."""
        url = f"{self.BASE_URL}/athlete/activities"
        params = {"page": page, "per_page": per_page}
        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()
