import fitparse
from sqlalchemy.orm import Session

import crud
import schemas
import models
from . import calculations


def parse_fit_file(
    content: bytes,
    db: Session,
    athlete_id: int,
    file_name: str,
) -> tuple[
    schemas.ActivityBase,
    list[dict],
    list[dict],
    list[schemas.PotentialPerformanceMarkerCreate],
]:
    """
    Parses FIT file content, calculates metrics, and prepares data for database insertion.
    """
    fitfile = fitparse.FitFile(content)

    record_dicts, power_data, lap_dicts = [], [], []
    record_fields = [
        "timestamp",
        "power",
        "heart_rate",
        "cadence",
        "speed",
        "altitude",
        "position_lat",
        "position_long",
    ]

    for message in fitfile.get_messages():
        if message.name == "lap":
            lap_data = {}
            lap_number = message.get_value("message_index")
            lap_data["lap_number"] = (
                lap_number if lap_number is not None else len(lap_dicts) + 1
            )
            lap_data["duration"] = int(message.get_value("total_timer_time") or 0)
            lap_data["distance"] = message.get_value("total_distance")
            lap_data["average_power"] = message.get_value("avg_power")
            lap_data["total_elevation_gain"] = message.get_value("total_ascent")
            lap_data["average_speed"] = message.get_value("avg_speed")
            lap_data["average_cadence"] = message.get_value("avg_cadence")
            lap_data["average_heart_rate"] = message.get_value("avg_heart_rate")
            lap_dicts.append(lap_data)

        if message.name != "record":
            continue

        record_data = {field: message.get_value(field) for field in record_fields}
        if not record_data.get("timestamp"):
            continue

        if record_data["position_lat"] is not None:
            record_data["latitude"] = record_data["position_lat"] * (180 / 2**31)
        else:
            record_data["latitude"] = None

        if record_data["position_long"] is not None:
            record_data["longitude"] = record_data["position_long"] * (180 / 2**31)
        else:
            record_data["longitude"] = None

        del record_data["position_lat"]
        del record_data["position_long"]

        record_dicts.append(record_data)
        power_data.append(record_data.get("power", 0) or 0)

    if not record_dicts:
        raise ValueError("No valid record messages found in FIT file.")

    # --- Device information ---

    device_id = None
    device_info_msg = next(fitfile.get_messages("device_info"), None)
    if device_info_msg:
        manufacturer = device_info_msg.get_value("manufacturer")
        product_name = device_info_msg.get_value("product_name")
        if (
            manufacturer
            and isinstance(manufacturer, str)
            and product_name
            and isinstance(product_name, str)
        ):
            device = crud.find_or_create_device(
                db, athlete_id, brand=manufacturer, model=product_name
            )
            device_id = device.equipment_id

    # --- Activity summary ---

    session_summary = next(fitfile.get_messages("session"), None)
    if not session_summary:
        raise ValueError("No session summary message found in FIT file.")

    start_time = session_summary.get_value("start_time")
    total_moving_time = int(session_summary.get_value("total_timer_time") or 0)
    total_elapsed_time = int(session_summary.get_value("total_elapsed_time") or 0)
    duration_seconds = total_moving_time

    # --- TRIMP Calculation ---
    trimp = 0
    hr_data = [
        r.get("heart_rate") for r in record_dicts if r.get("heart_rate") is not None
    ]
    lthr_record = crud.get_latest_lthr(
        db, athlete_id=athlete_id, activity_date=start_time
    )
    lthr = lthr_record[0] if lthr_record else None

    if lthr and hr_data:
        time_in_hr_zones = calculations.calculate_time_in_zones(
            hr_data, lthr, calculations.HR_ZONE_DEFINITIONS
        )
        trimp = calculations.calculate_trimp(time_in_hr_zones)

    # --- Normalized Power and TSS Calculations ---

    ftp_record = crud.get_latest_ftp(
        db, athlete_id=athlete_id, activity_date=start_time
    )
    ftp = ftp_record[0] if ftp_record else 0

    np = calculations.calculate_normalized_power(power_data)
    tss = calculations.calculate_tss(np, ftp, duration_seconds) if ftp > 0 else 0
    intensity_factor = round(np / ftp, 2) if ftp > 0 else 0.0

    # --- Unified Training Load Calculation ---
    athlete = crud.get_athlete(db, athlete_id)
    unified_training_load = 0
    if tss > 0:
        unified_training_load = tss
    elif trimp > 0 and athlete:
        unified_training_load = trimp * athlete.psf_trimp
    # PSS is not available on initial upload, only on edit.

    # --- Automatic Performance Marker Detection ---
    potential_markers_to_create: list[schemas.PotentialPerformanceMarkerCreate] = []

    if power_data:
        best_20_min = calculations.find_best_n_minute_average(power_data, 20)
        if best_20_min:
            best_20_min_power = best_20_min["max_average"]

            # FTP Detection
            estimated_ftp = best_20_min_power * 0.95
            current_ftp = ftp  # We already fetched this
            if estimated_ftp > (current_ftp or 0):
                potential_markers_to_create.append(
                    schemas.PotentialPerformanceMarkerCreate(
                        metric_type=models.MetricType.FTP,
                        value=int(round(estimated_ftp)),
                        date_detected=start_time,
                    )
                )

            # LTHR Detection (from the same 20-minute segment)
            if hr_data:
                segment_hr = hr_data[
                    best_20_min["start_index"] : best_20_min["end_index"] + 1
                ]
                estimated_lthr = sum(segment_hr) / len(segment_hr) if segment_hr else 0
                current_lthr = lthr  # We already fetched this
                if estimated_lthr > (current_lthr or 0):
                    potential_markers_to_create.append(
                        schemas.PotentialPerformanceMarkerCreate(
                            metric_type=models.MetricType.THR,
                            value=int(round(estimated_lthr)),
                            date_detected=start_time,
                        )
                    )

    # --- Activity data ---

    activity_data = schemas.ActivityBase(
        name=file_name.removesuffix(".fit").replace("_", " "),
        sport=session_summary.get_value("sport"),
        sub_sport=session_summary.get_value("sub_sport"),
        start_time=start_time,
        total_elapsed_time=total_elapsed_time,
        total_moving_time=total_moving_time,
        total_distance=session_summary.get_value("total_distance"),
        total_elevation_gain=session_summary.get_value("total_ascent"),
        total_calories=session_summary.get_value("total_calories"),
        normalized_power=np,
        intensity_factor=intensity_factor,
        tss=tss,
        unified_training_load=int(round(unified_training_load)),
        trimp=trimp,
        average_power=session_summary.get_value("avg_power"),
        max_power=session_summary.get_value("max_power"),
        average_speed=session_summary.get_value("avg_speed"),
        max_speed=session_summary.get_value("max_speed"),
        average_heart_rate=session_summary.get_value("avg_heart_rate"),
        max_heart_rate=session_summary.get_value("max_heart_rate"),
        average_cadence=session_summary.get_value("avg_cadence"),
        max_cadence=session_summary.get_value("max_cadence"),
        device_id=device_id,
    )

    return activity_data, record_dicts, lap_dicts, potential_markers_to_create
