import pytest
from datetime import date
from unittest.mock import MagicMock, patch

from services.calculations import (
    calculate_pss,
    calculate_trimp,
    calculate_normalized_power,
    calculate_tss,
    estimate_power_tacx,
    calculate_time_in_zones,
    calculate_daily_pmc,
    calculate_historical_mmp,
    recalculate_pmc_from_date,
    find_best_n_minute_average,
    POWER_ZONE_DEFINITIONS,
    HR_ZONE_DEFINITIONS,
    CTL_TC,
    ATL_TC,
)


# --- Test calculate_pss ---
def test_calculate_pss_valid_input():
    assert calculate_pss(rpe=7, duration_seconds=3600) == 420
    assert calculate_pss(rpe=5, duration_seconds=1800) == 150


def test_calculate_pss_zero_rpe():
    assert calculate_pss(rpe=0, duration_seconds=3600) == 0


def test_calculate_pss_negative_rpe():
    assert calculate_pss(rpe=-5, duration_seconds=3600) == 0


def test_calculate_pss_zero_duration():
    assert calculate_pss(rpe=7, duration_seconds=0) == 0


def test_calculate_pss_negative_duration():
    assert calculate_pss(rpe=7, duration_seconds=-1800) == 0


def test_calculate_pss_none_rpe():
    assert calculate_pss(rpe=None, duration_seconds=3600) == 0


# --- Test calculate_trimp ---
def test_calculate_trimp_valid_input():
    time_in_zones = {
        "Zone 1: Recovery": 600,  # 10 min
        "Zone 2: Aerobic": 1200,  # 20 min
        "Zone 3: Tempo": 600,  # 10 min
    }
    # (10 * 1) + (20 * 2) + (10 * 3) = 10 + 40 + 30 = 80
    assert calculate_trimp(time_in_zones) == 80


def test_calculate_trimp_empty_zones():
    assert calculate_trimp({}) == 0


def test_calculate_trimp_unknown_zone():
    time_in_zones = {
        "Zone 1: Recovery": 600,
        "Unknown Zone": 600,
    }
    # (10 * 1) + (10 * 0) = 10
    assert calculate_trimp(time_in_zones) == 10


def test_calculate_trimp_zero_time_in_zone():
    time_in_zones = {
        "Zone 1: Recovery": 0,
        "Zone 2: Aerobic": 1200,
    }
    assert calculate_trimp(time_in_zones) == 40


# --- Test calculate_normalized_power ---
def test_calculate_normalized_power_empty_data():
    assert calculate_normalized_power([]) == 0


def test_calculate_normalized_power_short_activity_fallback_to_average():
    power_data = [100, 110, 120, 130, 140]  # < 30 seconds
    assert (
        calculate_normalized_power(power_data) == 120
    )  # (100+110+120+130+140)/5 = 120


def test_calculate_normalized_power_constant_power():
    power_data = [200] * 60  # 60 seconds at 200W
    assert calculate_normalized_power(power_data) == 200


def test_calculate_normalized_power_variable_power():
    # Example from a known NP calculation
    power_data = [100] * 30 + [300] * 30  # 30s at 100W, 30s at 300W
    # This is a simplified check, actual NP is complex.
    # The rolling average will smooth this out.
    # For 30s window, the first 29 values will be NaN.
    # Then it will be 100 for 1s, then increasing to 200, then 300.
    # A rough estimate should be higher than simple average (200).
    np_result = calculate_normalized_power(power_data)
    assert np_result > 200
    assert np_result < 300  # Should not be as high as peak power


def test_calculate_normalized_power_with_zeros():
    power_data = [0] * 30 + [200] * 30
    np_result = calculate_normalized_power(power_data)
    assert np_result > 0


# --- Test calculate_tss ---
def test_calculate_tss_valid_input():
    # Example: NP=250, FTP=200, Duration=3600s (1 hour)
    # IF = 250/200 = 1.25
    # TSS = (3600 * 250 * 1.25) / (200 * 3600) * 100 = (3600 * 312.5) / 720000 * 100 = 1125000 / 720000 * 100 = 1.5625 * 100 = 156.25
    assert calculate_tss(normalized_power=250, ftp=200, duration_seconds=3600) == 156


def test_calculate_tss_zero_ftp():
    assert calculate_tss(normalized_power=200, ftp=0, duration_seconds=3600) == 0


def test_calculate_tss_zero_duration():
    assert calculate_tss(normalized_power=200, ftp=200, duration_seconds=0) == 0


def test_calculate_tss_zero_normalized_power():
    assert calculate_tss(normalized_power=0, ftp=200, duration_seconds=3600) == 0


def test_calculate_tss_negative_values():
    assert calculate_tss(normalized_power=200, ftp=-200, duration_seconds=3600) == 0
    assert calculate_tss(normalized_power=200, ftp=200, duration_seconds=-3600) == 0
    assert calculate_tss(normalized_power=-200, ftp=200, duration_seconds=3600) == 0


# --- Test estimate_power_tacx ---
def test_estimate_power_tacx_valid_input():
    # Using the formula: a_coefficient = 2.5 + (setting - 1) * 1.4815
    # Setting 1: a = 2.5, power = 2.5 * speed
    assert estimate_power_tacx(speed_kmh=10, setting=1) == 25.0
    assert estimate_power_tacx(speed_kmh=60, setting=1) == 150.0
    # Setting 10: a = 2.5 + 9 * 1.4815 = 2.5 + 13.3335 = 15.8335
    # power = 15.8335 * speed
    assert estimate_power_tacx(speed_kmh=10, setting=10) == 158.335
    assert estimate_power_tacx(speed_kmh=60, setting=10) == 950.01


def test_estimate_power_tacx_invalid_setting_low():
    with pytest.raises(ValueError, match="Setting must be between 1 and 10"):
        estimate_power_tacx(speed_kmh=30, setting=0)


def test_estimate_power_tacx_invalid_setting_high():
    with pytest.raises(ValueError, match="Setting must be between 1 and 10"):
        estimate_power_tacx(speed_kmh=30, setting=11)


def test_estimate_power_tacx_zero_speed():
    assert estimate_power_tacx(speed_kmh=0, setting=5) == 0.0


def test_estimate_power_tacx_negative_speed():
    assert estimate_power_tacx(speed_kmh=-10, setting=5) == -10 * (
        2.5 + 4 * 1.4815
    )  # Should return negative power based on formula


# --- Test calculate_time_in_zones ---
def test_calculate_time_in_zones_power_valid():
    data_stream = [50, 70, 90, 110, 130, 150, 170, 190, 210, 230]
    ftp = 100
    # Zone 1: <55 (50) -> 1
    # Zone 2: <76 (70) -> 1
    # Zone 3: <91 (90) -> 1
    # Zone 4: <106 (no values) -> 0
    # Zone 5: <121 (110) -> 1
    # Zone 6: <151 (130, 150) -> 2
    # Zone 7: >=151 (170, 190, 210, 230) -> 4
    expected_zones = {
        "Zone 1: Active Recovery": 1,
        "Zone 2: Endurance": 1,
        "Zone 3: Tempo": 1,
        "Zone 4: Threshold": 0,
        "Zone 5: VO2 Max": 1,
        "Zone 6: Anaerobic": 2,
        "Zone 7: Neuromuscular": 4,
    }
    result = calculate_time_in_zones(data_stream, ftp, POWER_ZONE_DEFINITIONS)
    assert result == expected_zones


def test_calculate_time_in_zones_hr_valid():
    data_stream = [70, 80, 90, 100, 110, 120]
    lthr = 100
    # Zone 1: <85 (70, 80) -> 2
    # Zone 2: 85-89 (None) -> 0
    # Zone 3: 90-93 (90) -> 1
    # Zone 4: 94-99 (None) -> 0
    # Zone 5: 100-106 (100) -> 1
    # Zone 6: >106 (110, 120) -> 2
    expected_zones = {
        "Zone 1: Recovery": 2,
        "Zone 2: Aerobic": 0,
        "Zone 3: Tempo": 1,
        "Zone 4: Sub-Threshold": 0,
        "Zone 5: Super-Threshold (VO2 Max)": 1,
        "Zone 6: Anaerobic Capacity": 2,
    }
    result = calculate_time_in_zones(data_stream, lthr, HR_ZONE_DEFINITIONS)
    assert result == expected_zones


def test_calculate_time_in_zones_empty_data_stream():
    ftp = 200
    expected_zones = {zone_name: 0 for zone_name in POWER_ZONE_DEFINITIONS}
    assert calculate_time_in_zones([], ftp, POWER_ZONE_DEFINITIONS) == expected_zones


def test_calculate_time_in_zones_zero_threshold():
    data_stream = [100, 150, 200]
    threshold = 0
    expected_zones = {zone_name: 0 for zone_name in POWER_ZONE_DEFINITIONS}
    assert (
        calculate_time_in_zones(data_stream, threshold, POWER_ZONE_DEFINITIONS)
        == expected_zones
    )


def test_calculate_time_in_zones_none_values_in_stream():
    data_stream = [100, None, 150]
    ftp = 100
    # 100 -> Zone 4
    # 150 -> Zone 6
    expected_zones = {zone_name: 0 for zone_name in POWER_ZONE_DEFINITIONS}
    expected_zones["Zone 4: Threshold"] = 1
    expected_zones["Zone 6: Anaerobic"] = 1
    result = calculate_time_in_zones(data_stream, ftp, POWER_ZONE_DEFINITIONS)
    assert result == expected_zones


# --- Test calculate_daily_pmc ---
def test_calculate_daily_pmc_initial_day():
    # If ctl_yesterday and atl_yesterday are 0, then ctl_today = tss_today / CTL_TC
    # atl_today = tss_today / ATL_TC
    tss_today = 100
    ctl_today_expected = 0 + (100 - 0) / CTL_TC
    atl_today_expected = 0 + (100 - 0) / ATL_TC
    result = calculate_daily_pmc(0.0, 0.0, tss_today)
    assert pytest.approx(result["ctl"]) == ctl_today_expected
    assert pytest.approx(result["atl"]) == atl_today_expected
    assert pytest.approx(result["tsb"]) == ctl_today_expected - atl_today_expected


def test_calculate_daily_pmc_ongoing_training():
    ctl_yesterday = 50.0
    atl_yesterday = 70.0
    tss_today = 80
    ctl_today_expected = ctl_yesterday + (tss_today - ctl_yesterday) / CTL_TC
    atl_today_expected = atl_yesterday + (tss_today - atl_yesterday) / ATL_TC
    result = calculate_daily_pmc(ctl_yesterday, atl_yesterday, tss_today)
    assert pytest.approx(result["ctl"]) == ctl_today_expected
    assert pytest.approx(result["atl"]) == atl_today_expected
    assert pytest.approx(result["tsb"]) == ctl_today_expected - atl_today_expected


def test_calculate_daily_pmc_rest_day():
    ctl_yesterday = 50.0
    atl_yesterday = 70.0
    tss_today = 0  # Rest day
    ctl_today_expected = ctl_yesterday + (tss_today - ctl_yesterday) / CTL_TC
    atl_today_expected = atl_yesterday + (tss_today - atl_yesterday) / ATL_TC
    result = calculate_daily_pmc(ctl_yesterday, atl_yesterday, tss_today)
    assert pytest.approx(result["ctl"]) == ctl_today_expected
    assert pytest.approx(result["atl"]) == atl_today_expected
    assert pytest.approx(result["tsb"]) == ctl_today_expected - atl_today_expected


# --- Test calculate_historical_mmp ---
def test_calculate_historical_mmp_empty_data():
    assert calculate_historical_mmp([], [1, 5, 10]) == []


def test_calculate_historical_mmp_short_data():
    power_data = [100, 110, 120]
    intervals = [1, 2, 5]
    # Only 1s and 2s intervals can be calculated
    expected = [
        {"duration": 1, "power": 120},  # Max of [100, 110, 120]
        {"duration": 2, "power": 115},  # Max of [(100+110)/2, (110+120)/2] = [105, 115]
    ]
    assert calculate_historical_mmp(power_data, intervals) == expected


def test_calculate_historical_mmp_valid_data():
    power_data = [100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200]  # 11 seconds
    intervals = [1, 5, 10]
    expected = [
        {"duration": 1, "power": 200},
        {"duration": 5, "power": 180},  # (160+170+180+190+200)/5 = 180
        {
            "duration": 10,
            "power": 155,
        },  # (110+120+130+140+150+160+170+180+190+200)/10 = 155
    ]
    assert calculate_historical_mmp(power_data, intervals) == expected


def test_calculate_historical_mmp_with_none_values():
    power_data = [100, 110, None, 130, 140, 150, 160, 170, 180, 190, 200]  # 11 seconds
    intervals = [1, 5, 10]
    # Pandas rolling mean handles NaNs by skipping windows that contain NaN values.
    # For interval 10, most windows contain the None value, so no valid results are produced.
    result = calculate_historical_mmp(power_data, intervals)
    assert len(result) == 2  # Only intervals 1 and 5 produce valid results
    assert result[0]["power"] == 200
    assert result[1]["power"] == 180


# --- Test recalculate_pmc_from_date ---
@patch("services.calculations.crud")
def test_recalculate_pmc_from_date_no_previous_metrics(mock_crud):
    mock_db = MagicMock()
    athlete_id = 1
    start_recalc_date = date(2023, 1, 1)

    mock_crud.get_latest_daily_metric_before_date.return_value = None
    mock_crud.get_latest_daily_metric.return_value = None  # Simulate no future metrics
    mock_crud.get_daily_activity_summary.side_effect = [
        {"total_tss": 10, "avg_if": 0.5},
        {"total_tss": 20, "avg_if": 0.6},
        {"total_tss": 0, "avg_if": 0.0},
    ]

    # Mock date.today() to control the loop
    with patch("services.calculations.date") as mock_date:
        mock_date.today.return_value = date(2023, 1, 3)
        mock_date.side_effect = lambda *args, **kw: date(
            *args, **kw
        )  # Allow date(Y,M,D) calls

        recalculate_pmc_from_date(mock_db, athlete_id, start_recalc_date)

    assert mock_crud.get_latest_daily_metric_before_date.call_count == 1
    assert mock_crud.get_daily_activity_summary.call_count == 3
    assert mock_crud.upsert_daily_metric.call_count == 3
    assert mock_db.commit.call_count == 1

    # Verify initial CTL/ATL are 0.0
    # Day 1: TSS=10, CTL=10/42, ATL=10/7
    # Day 2: TSS=20, CTL=prev_ctl + (20 - prev_ctl)/42, ATL=prev_atl + (20 - prev_atl)/7
    # Day 3: TSS=0, CTL=prev_ctl + (0 - prev_ctl)/42, ATL=prev_atl + (0 - prev_atl)/7

    # Check the first upsert call
    args, kwargs = mock_crud.upsert_daily_metric.call_args_list[0]
    assert kwargs["athlete_id"] == athlete_id
    assert kwargs["date"] == date(2023, 1, 1)
    assert pytest.approx(kwargs["ctl"]) == (10 / CTL_TC)
    assert pytest.approx(kwargs["atl"]) == (10 / ATL_TC)
    assert kwargs["tss"] == 10


@patch("services.calculations.crud")
def test_recalculate_pmc_from_date_with_previous_metrics(mock_crud):
    mock_db = MagicMock()
    athlete_id = 1
    start_recalc_date = date(2023, 1, 5)

    mock_metric_before = MagicMock(ctl=40.0, atl=60.0)
    mock_crud.get_latest_daily_metric_before_date.return_value = mock_metric_before
    mock_crud.get_latest_daily_metric.return_value = None
    mock_crud.get_daily_activity_summary.side_effect = [
        {"total_tss": 50, "avg_if": 0.7},
        {"total_tss": 10, "avg_if": 0.4},
    ]

    with patch("services.calculations.date") as mock_date:
        mock_date.today.return_value = date(2023, 1, 6)
        mock_date.side_effect = lambda *args, **kw: date(*args, **kw)

        recalculate_pmc_from_date(mock_db, athlete_id, start_recalc_date)

    assert mock_crud.get_latest_daily_metric_before_date.call_count == 1
    assert mock_crud.get_daily_activity_summary.call_count == 2
    assert mock_crud.upsert_daily_metric.call_count == 2
    assert mock_db.commit.call_count == 1

    # Check the first upsert call
    args, kwargs = mock_crud.upsert_daily_metric.call_args_list[0]
    assert kwargs["athlete_id"] == athlete_id
    assert kwargs["date"] == date(2023, 1, 5)
    # Expected CTL/ATL for Day 1 (Jan 5)
    expected_ctl_day1 = mock_metric_before.ctl + (50 - mock_metric_before.ctl) / CTL_TC
    expected_atl_day1 = mock_metric_before.atl + (50 - mock_metric_before.atl) / ATL_TC
    assert pytest.approx(kwargs["ctl"]) == expected_ctl_day1
    assert pytest.approx(kwargs["atl"]) == expected_atl_day1
    assert kwargs["tss"] == 50


# --- Test find_best_n_minute_average ---
def test_find_best_n_minute_average_empty_data():
    assert find_best_n_minute_average([], 20) == {}


def test_find_best_n_minute_average_short_data():
    data_stream = [100, 110, 120]  # 3 seconds
    assert (
        find_best_n_minute_average(data_stream, 1) == {}
    )  # Interval 1 min (60s) is too long


def test_find_best_n_minute_average_valid_data():
    data_stream = [10] * 30 + [20] * 60 + [15] * 30  # 30s at 10, 60s at 20, 30s at 15
    interval_minutes = 1  # 60 seconds
    result = find_best_n_minute_average(data_stream, interval_minutes)
    assert pytest.approx(result["max_average"]) == 20.0
    assert result["start_index"] == 30
    assert result["end_index"] == 89  # 30 + 60 - 1


def test_find_best_n_minute_average_multiple_peaks():
    data_stream = (
        [10] * 60 + [30] * 60 + [20] * 60 + [35] * 60
    )  # 1 min at 10, 1 min at 30, 1 min at 20, 1 min at 35
    interval_minutes = 1
    result = find_best_n_minute_average(data_stream, interval_minutes)
    assert pytest.approx(result["max_average"]) == 35.0
    assert result["start_index"] == 180
    assert result["end_index"] == 239


def test_find_best_n_minute_average_with_none_values():
    data_stream = [10] * 30 + [None] * 10 + [20] * 60 + [15] * 30
    interval_minutes = 1
    # Pandas rolling mean will produce NaN if there are NaNs in the window.
    # This test checks if it handles it gracefully (returns {} if no valid window).
    result = find_best_n_minute_average(data_stream, interval_minutes)
    # Depending on how pandas handles NaNs in rolling.mean().max(), this might return {} or a value.
    # Given the current implementation, if a window contains None, its mean will be NaN,
    # and max() will ignore NaNs, so it should still find the 20.0 average.
    assert pytest.approx(result["max_average"]) == 20.0
    assert result["start_index"] == 40
    assert result["end_index"] == 99
