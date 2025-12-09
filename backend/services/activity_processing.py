from sqlalchemy.orm import Session
import pandas as pd
from datetime import date, timedelta
from collections import defaultdict
from typing import List

import models
import schemas
from . import calculations


def recalculate_virtual_power(
    db: Session, activity: models.Activity, trainer_setting: int
):
    """
    Recalculates power for an activity's records using a virtual power model.
    Then, recalculates all power-dependent summary statistics for the activity.
    """
    # 1. Check if power data is already present. If so, do nothing.
    # A simple check on average_power is a good heuristic.
    if activity.average_power is not None and activity.average_power > 0:
        return activity

    # 2. Iterate through records and calculate virtual power
    power_data = []
    records_to_update = []
    for record in activity.records:
        if record.speed is not None and record.speed > 0:
            speed_kmh = record.speed * 3.6
            virtual_power = calculations.estimate_power_tacx(speed_kmh, trainer_setting)
            record.power = int(virtual_power)
            records_to_update.append(record)
            power_data.append(record.power)
        else:
            power_data.append(0)

    if not records_to_update:
        return activity  # No speed data to calculate from

    # 3. Recalculate power-dependent summary statistics
    activity.average_power = int(sum(power_data) / len(power_data)) if power_data else 0
    activity.max_power = int(max(power_data)) if power_data else 0

    # Get FTP for TSS/IF calculation
    from crud import get_latest_ftp  # Local import to avoid circular dependency

    ftp_record = get_latest_ftp(
        db, athlete_id=activity.athlete_id, activity_date=activity.start_time
    )
    ftp = ftp_record[0] if ftp_record else 0

    np = calculations.calculate_normalized_power(power_data)
    activity.normalized_power = np
    activity.tss = (
        calculations.calculate_tss(np, ftp, activity.total_moving_time)
        if ftp > 0
        else 0
    )
    activity.intensity_factor = round(np / ftp, 2) if ftp > 0 else 0.0

    # The activity object and its records are part of the session, so they will be
    # committed by the calling function (crud.update_activity).
    db.add(activity)
    return activity


def process_weekly_workload(
    daily_aggregates: list, end_date: date
) -> schemas.WeeklyWorkload:
    """
    Processes a list of daily metric aggregates into a weekly workload time-series analysis.
    Calculates a 4-week rolling average and standard deviation.
    """
    if not daily_aggregates:
        return schemas.WeeklyWorkload(weeks=[])

    # 1. Convert to DataFrame and ensure all days are present
    df = pd.DataFrame(daily_aggregates, columns=["date", "value"])
    df["date"] = pd.to_datetime(df["date"])
    df.set_index("date", inplace=True)

    # Create a full date range for the last 16 weeks ending at the activity_date
    # This ensures we always show a complete 12-week chart even with missing data
    history_start_date = end_date - timedelta(weeks=16)
    week_end_date = end_date + timedelta(
        days=6 - end_date.weekday()
    )  # End of week containing end_date
    full_date_range = pd.date_range(
        start=history_start_date, end=week_end_date, freq="D"
    )
    df = df.reindex(full_date_range, fill_value=0)

    # 2. Resample daily data into weekly sums, with weeks starting on Monday.
    weekly_sums = df["value"].resample("W-MON").sum().to_frame(name="weekly_total")

    # 3. Calculate 4-week rolling average and standard deviation
    weekly_sums["rolling_avg"] = weekly_sums["weekly_total"].rolling(window=4).mean()
    rolling_std = weekly_sums["weekly_total"].rolling(window=4).std()

    weekly_sums["rolling_std_upper"] = weekly_sums["rolling_avg"] + rolling_std
    weekly_sums["rolling_std_lower"] = weekly_sums["rolling_avg"] - rolling_std

    # 4. Handle NaN values and clean up data
    # Forward fill to handle NaNs at the beginning of the rolling calculations
    weekly_sums = weekly_sums.bfill()
    # Fill any remaining NaNs (if bfill wasn't enough) with 0 to ensure JSON compliance
    weekly_sums = weekly_sums.fillna(0)
    # Ensure lower bound is not negative
    weekly_sums["rolling_std_lower"] = weekly_sums["rolling_std_lower"].clip(lower=0)
    # Reset index to get 'date' as a column
    final_weeks_df = weekly_sums.reset_index().rename(
        columns={"index": "week_start_date"}
    )

    # 5. Take the last 12 weeks for the final output
    final_weeks_df = final_weeks_df.tail(12)

    # 6. Convert to Pydantic models
    workload_data_points = [
        schemas.WeeklyWorkloadDataPoint(**row.to_dict())
        for _, row in final_weeks_df.iterrows()
    ]

    return schemas.WeeklyWorkload(weeks=workload_data_points)


def process_visual_activity_log(
    activities: List[models.Activity], metric: str
) -> List[schemas.WeeklyActivityData]:
    """
    Processes activities into weekly data for visual bubble chart display.
    Groups activities by ISO weeks and creates chart data points.
    """
    if not activities:
        return []

    # Metric mapping
    metric_map = {
        "moving_time": "total_moving_time",
        "distance": "total_distance",
        "unified_training_load": "unified_training_load",
    }
    metric_field = metric_map.get(metric, "total_moving_time")

    # Group activities by week (ISO week: Monday-Sunday)
    weekly_activities = defaultdict(list)
    for activity in activities:
        # Get ISO week start (Monday)
        activity_date = activity.start_time.date()
        week_start = activity_date - timedelta(days=activity_date.weekday())  # Monday
        weekly_activities[week_start].append(activity)

    # Sort weeks with most recent first
    sorted_weeks = sorted(weekly_activities.keys(), reverse=True)

    weekly_data = []
    for week_start in sorted_weeks:
        week_activities = weekly_activities[week_start]
        week_end = week_start + timedelta(days=6)

        # Group activities by day within the week
        daily_activities = defaultdict(list)
        for activity in week_activities:
            day = activity.start_time.date()
            daily_activities[day].append(activity)

        # Create chart data points
        chart_data = []
        day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        week_total = 0.0
        week_total_time = 0.0
        week_total_distance = 0.0
        week_total_load = 0.0

        for i, day_name in enumerate(day_names):
            day_date = week_start + timedelta(days=i)
            day_acts = daily_activities.get(day_date, [])

            if not day_acts:
                # Empty day - add a zero point
                chart_data.append(
                    schemas.ChartDataPoint(
                        day=day_name,
                        stack_index=1,
                        metric_value=0.0,
                        color="#e5e7eb",  # gray for empty
                        daily_activities=[],
                    )
                )
                continue

            # Sort activities by start time for consistent stacking
            day_acts_sorted = sorted(day_acts, key=lambda a: a.start_time)

            stack_index = 1
            for activity in day_acts_sorted:
                metric_value = getattr(activity, metric_field)
                if pd.isna(metric_value):
                    metric_value = 0.0
                if metric_value > 0:
                    week_total += metric_value

                # Accumulate totals for all metrics
                time_val = getattr(activity, "total_moving_time") or 0.0
                dist_val = getattr(activity, "total_distance") or 0.0
                load_val = getattr(activity, "unified_training_load")
                if pd.isna(load_val):
                    load_val = 0.0
                week_total_time += time_val
                week_total_distance += dist_val
                week_total_load += load_val

                if metric_value > 0:
                    # Get color based on sport
                    color = get_sport_color(activity.sport)

                    # Format duration for display
                    duration_str = format_duration(activity.total_moving_time or 0)

                    daily_act = schemas.DailyActivity(
                        activity_id=activity.activity_id,
                        name=activity.name,
                        time=duration_str,
                    )

                    chart_data.append(
                        schemas.ChartDataPoint(
                            day=day_name,
                            stack_index=stack_index,
                            metric_value=float(metric_value),
                            color=color,
                            daily_activities=[daily_act],
                        )
                    )
                    stack_index += 1

        weekly_data.append(
            schemas.WeeklyActivityData(
                week_start_date=week_start.isoformat(),
                week_end_date=week_end.isoformat(),
                total_metric=week_total,
                total_time=week_total_time,
                total_distance=week_total_distance,
                total_load=week_total_load,
                chart_data=chart_data,
            )
        )

    return weekly_data


def get_sport_color(sport: str) -> str:
    """Returns color for sport type."""
    sport_colors = {
        "cycling": "#22c55e",  # green
        "run": "#f59e0b",  # amber
        "gym": "#8b5cf6",  # violet
        "yoga": "#ec4899",  # pink
        "meditation": "#ec4899",  # pink
        "walk": "#06b6d4",  # cyan
        "hike": "#10b981",  # emerald
        "swim": "#3b82f6",  # blue
        "other": "#6b7280",  # gray
    }
    sport_lower = (sport or "").lower()
    return sport_colors.get(sport_lower, sport_colors["other"])


def format_duration(seconds: int) -> str:
    """Format duration in seconds to readable string."""
    if not seconds:
        return "0m"

    hours = seconds // 3600
    minutes = (seconds % 3600) // 60

    if hours > 0:
        return f"{hours}h {minutes}m"
    else:
        return f"{minutes}m"
