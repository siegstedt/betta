from __future__ import annotations
import numpy as np
import pandas as pd
from datetime import date, timedelta
import crud

# --- Perceived Strain Score (PSS) based on Perceived Exertion ---


def calculate_pss(rpe: int, duration_seconds: int) -> int:
    """Calculates Perceived Strain Score (PSS) from RPE and duration."""
    if not rpe or rpe <= 0 or duration_seconds <= 0:
        return 0
    duration_minutes = duration_seconds / 60
    return int(round(rpe * duration_minutes))


# --- Heart Rate Zones-based TRIMP ---

TRIMP_ZONE_WEIGHTS = {
    "Zone 1: Recovery": 1.0,
    "Zone 2: Aerobic": 2.0,
    "Zone 3: Tempo": 3.0,
    "Zone 4: Sub-Threshold": 4.0,
    "Zone 5: Super-Threshold (VO2 Max)": 5.0,
    "Zone 6: Anaerobic Capacity": 6.0,
}


def calculate_trimp(time_in_hr_zones: dict) -> int:
    """Calculates zone-based TRIMP (zTRIMP) from time spent in HR zones."""
    total_trimp = 0
    if not time_in_hr_zones:
        return 0

    for zone_name, time_seconds in time_in_hr_zones.items():
        weight = TRIMP_ZONE_WEIGHTS.get(zone_name, 0)
        time_minutes = time_seconds / 60
        total_trimp += time_minutes * weight

    return int(round(total_trimp))


# --- Normalized Power and TSS Calculations ---


def calculate_normalized_power(power_data: list[int]) -> int:
    """
    Calculates Normalized Power (NP) from a list of second-by-second power data.

    The process is as follows:
    1. Calculate a 30-second rolling average of the power data.
    2. Raise each value in the rolling average series to the fourth power.
    3. Calculate the average of these fourth-power values.
    4. Take the fourth root of that average.

    Args:
        power_data: A list of integers representing power in watts for each second.

    Returns:
        The calculated Normalized Power as an integer. Returns 0 if input is empty.
        If the activity is shorter than 30s, it falls back to average power.
    """
    if not power_data:
        return 0

    power_series = pd.Series(power_data)

    # 1. 30-second rolling average. The first 29 values will be NaN.
    rolling_avg = power_series.rolling(window=30).mean()

    # 2. Raise to the fourth power. NaNs will propagate.
    fourth_power = np.power(rolling_avg, 4)

    # 3. Average of the fourth powers. .mean() ignores NaNs by default.
    mean_of_fourth_power = fourth_power.mean()

    # Handle case where mean is NaN (e.g., input list < 30 seconds)
    if bool(pd.isna(mean_of_fourth_power)):
        # Fallback for very short activities: calculate simple average power.
        avg_power = power_series.mean()
        return int(round(avg_power)) if not bool(pd.isna(avg_power)) else 0

    # 4. Fourth root of the average
    normalized_power = np.power(mean_of_fourth_power, 0.25)

    return int(round(normalized_power))


def calculate_tss(normalized_power: int, ftp: int, duration_seconds: int) -> int:
    """
    Calculates Training Stress Score (TSS).

    TSS = (duration_seconds * NP * IF) / (FTP * 3600) * 100
    where IF (Intensity Factor) = NP / FTP

    Args:
        normalized_power: The Normalized Power for the activity.
        ftp: The Functional Threshold Power of the athlete.
        duration_seconds: The total duration of the activity in seconds.

    Returns:
        The calculated Training Stress Score as an integer.
    """
    if ftp <= 0 or duration_seconds <= 0 or normalized_power <= 0:
        return 0

    intensity_factor = normalized_power / ftp
    tss = (duration_seconds * normalized_power * intensity_factor) / (ftp * 3600) * 100

    return int(round(tss))


# --- Virtual Power Calculation (Tacx Blue Motion T2600) ---

# Reference Data Table:
# Speed (km/h),Setting 1,Setting 2,Setting 3,Setting 4,Setting 5,Setting 6,Setting 7,Setting 8,Setting 9,Setting 10
# 10,25,40,55,69,84,99,114,129,144,158
# 15,38,60,82,104,126,149,171,193,215,238
# 20,50,80,109,139,169,198,228,257,287,317
# 25,62,100,137,174,211,248,285,322,359,396
# 30,75,119,164,208,253,297,342,386,431,475
# 35,88,139,191,243,295,347,399,450,502,554
# 40,100,159,219,278,337,396,456,515,574,633
# 45,112,179,246,313,379,446,513,579,646,713
# 50,125,199,273,347,421,495,569,644,718,792
# 55,138,219,300,382,463,545,626,708,789,871
# 60,150,239,328,417,506,594,683,772,861,950


def estimate_power_tacx(speed_kmh: float, setting: int) -> float:
    """
    Estimates power output for a Tacx Blue Motion T2600 trainer
    using a corrected linear model with constant deltas between settings.

    Args:
      speed_kmh: The speed in km/h.
      setting: The resistance setting of the trainer (1-10).

    Returns:
      The estimated power in watts.

    Raises:
        ValueError: If the provided setting is not available in the power curves.
    """
    if not 1 <= setting <= 10:
        raise ValueError("Setting must be between 1 and 10")

    # The coefficient 'a' is calculated based on a base value for setting 1
    # and a constant delta for each subsequent setting.
    # a = a_base + (setting - 1) * a_delta
    # a_base = 2.5 (from 150W / 60kmh)
    # a_delta = ((950/60) - (150/60)) / 9 = 1.4815

    a_coefficient = 2.5 + (setting - 1) * 1.4815

    power = a_coefficient * speed_kmh
    return power


# --- Zone Calculation ---

POWER_ZONE_DEFINITIONS = {
    # Zone: (% of FTP upper bound)
    # Coggan's zones are inclusive, so 56-75% means upper bound is < 76%
    "Zone 1: Active Recovery": 0.55,
    "Zone 2: Endurance": 0.76,
    "Zone 3: Tempo": 0.91,
    "Zone 4: Threshold": 1.06,
    "Zone 5: VO2 Max": 1.21,
    "Zone 6: Anaerobic": 1.51,
    "Zone 7: Neuromuscular": float("inf"),
}

HR_ZONE_DEFINITIONS = {
    # Zone: (% of LTHR upper bound)
    "Zone 1: Recovery": 0.85,
    "Zone 2: Aerobic": 0.90,
    "Zone 3: Tempo": 0.94,
    "Zone 4: Sub-Threshold": 1.00,
    "Zone 5: Super-Threshold (VO2 Max)": 1.06,
    "Zone 6: Anaerobic Capacity": float("inf"),
}


def calculate_time_in_zones(
    data_stream: list[int], threshold: int, zone_definitions: dict
) -> dict[str, int]:
    """
    Calculates the total time in seconds spent in each physiological zone.
    """
    if not threshold or not data_stream:
        return {zone_name: 0 for zone_name in zone_definitions}

    zones = {zone_name: 0 for zone_name in zone_definitions}
    for value in data_stream:
        if value is None:
            continue

        percent_of_threshold = value / threshold
        for zone_name, upper_bound in zone_definitions.items():
            if percent_of_threshold < upper_bound:
                zones[zone_name] += 1
                break

    return zones


# --- Performance Management Chart (PMC) Calculations ---

CTL_TC = 42  # Chronic Training Load time constant
ATL_TC = 7  # Acute Training Load time constant


def calculate_daily_pmc(
    ctl_yesterday: float, atl_yesterday: float, tss_today: int
) -> dict:
    """
    Calculates CTL, ATL, and TSB for a single day based on yesterday's state.
    """
    ctl_today = ctl_yesterday + (tss_today - ctl_yesterday) / CTL_TC
    atl_today = atl_yesterday + (tss_today - atl_yesterday) / ATL_TC
    tsb_today = ctl_today - atl_today
    return {"ctl": ctl_today, "atl": atl_today, "tsb": tsb_today}


def calculate_historical_mmp(power_data: list[int], intervals: list[int]) -> list[dict]:
    """
    Calculates the Mean Maximal Power (MMP) curve from a large series of power data.
    """
    if not power_data:
        return []

    power_series = pd.Series(power_data)
    mmp_curve = []

    for interval in intervals:
        if len(power_series) >= interval:
            # Calculate rolling average and find the max
            max_power = power_series.rolling(window=interval).mean().max()
            if bool(pd.notna(max_power)):
                mmp_curve.append({"duration": interval, "power": int(round(max_power))})

    return mmp_curve


def recalculate_pmc_from_date(db, athlete_id: int, start_recalc_date: date):
    """
    Recalculates all PMC data for an athlete from a specific date forward.
    This handles historical uploads, deleted activities, and data corrections.

    NOTE: This function is imported and used by routers/activities.py. It is placed
    here to keep all performance calculation logic together.
    """
    # 1. Get the state (CTL/ATL) on the day *before* the recalculation starts.
    metric_before_start = crud.get_latest_daily_metric_before_date(
        db, athlete_id, start_recalc_date
    )

    if metric_before_start:
        current_ctl = metric_before_start.ctl
        current_atl = metric_before_start.atl
    else:
        current_ctl, current_atl = 0.0, 0.0

    # 2. Determine the full range to recalculate.
    last_metric = crud.get_latest_daily_metric(db, athlete_id)
    today = date.today()

    end_recalc_date = today
    if last_metric and last_metric.date > today:
        end_recalc_date = last_metric.date

    # 3. Loop through each day in the range, recalculating and upserting.
    current_date = start_recalc_date
    while current_date <= end_recalc_date:
        daily_summary = crud.get_daily_activity_summary(db, athlete_id, current_date)
        pmc_values = calculate_daily_pmc(
            current_ctl, current_atl, daily_summary["total_tss"]
        )
        crud.upsert_daily_metric(
            db,
            athlete_id=athlete_id,
            date=current_date,
            **pmc_values,
            tss=daily_summary["total_tss"],
            if_avg=daily_summary["avg_if"],
        )
        current_ctl, current_atl = pmc_values["ctl"], pmc_values["atl"]
        current_date += timedelta(days=1)

    db.commit()


# ---  Logic for finding the best 20-minute segment ---


def find_best_n_minute_average(data_stream: list, interval_minutes: int) -> dict:
    """
    Finds the best N-minute average from a second-by-second data stream.
    Returns the max average value and the start/end indices of that segment.
    """
    if not data_stream or len(data_stream) < interval_minutes * 60:
        return {}

    interval_seconds = interval_minutes * 60
    series = pd.Series(data_stream)

    # Calculate the rolling average
    rolling_avg = series.rolling(window=interval_seconds).mean()

    # Find the maximum average value and the index where it occurs
    max_avg = rolling_avg.max()
    if bool(pd.isna(max_avg)):
        return {}

    # idxmax() gives the end index of the window where the max average was found
    end_index = int(rolling_avg.idxmax())
    start_index = end_index - interval_seconds + 1

    return {"max_average": max_avg, "start_index": start_index, "end_index": end_index}
