// These types mirror the Pydantic schemas from the backend API.
// Keeping them in a central file ensures type consistency across the frontend.

export type AthleteSummary = {
  athlete_id: number;
  first_name: string;
  last_name: string;
  profile_picture_url?: string;
};

export type Athlete = {
  athlete_id: number;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  profile_picture_url?: string;
  created_at: string;
  metrics: AthleteMetric[];
  activities: ActivitySummary[];
  equipment: Equipment[];
};

export type Equipment = {
  equipment_id: number;
  athlete_id: number;
  name: string;
  equipment_type: 'bike' | 'shoes' | 'trainer' | 'device';
  brand?: string;
  model?: string;
  weight?: number;
  notes?: string;
};

export type AthleteMetric = {
  metric_id: number;
  athlete_id: number;
  metric_type: 'weight' | 'ftp' | 'thr';
  value: number;
  date_established: string;
};

export type PotentialPerformanceMarker = {
  id: number;
  athlete_id: number;
  metric_type: 'weight' | 'ftp' | 'thr';
  value: number;
  date_detected: string;
  date_established?: string;
};

export type ActivityLap = {
  lap_id: number;
  activity_id: number;
  lap_number: number;
  duration?: number;
  distance?: number;
  average_power?: number;
  total_elevation_gain?: number;
  average_speed?: number;
  average_cadence?: number;
  average_heart_rate?: number;
};

export type ActivitySummary = {
  activity_id: number | null;
  athlete_id: number;
  name: string;
  sport?: string;
  sub_sport?: string;
  start_time: string;
  total_moving_time?: number;
  total_distance?: number;
  total_elevation_gain?: number;
  normalized_power?: number;
  average_power?: number;
  average_speed?: number;
  total_calories?: number;
  unified_training_load?: number;
  description?: string;
  ride_type?: string;
  perceived_exertion?: number;
  intensity_factor?: number;
  tss?: number;
  average_heart_rate?: number;
  average_cadence?: number;
  bike_id?: number | null;
  shoe_id?: number | null;
  device_id?: number | null;
  trainer_id?: number | null;
};

export type ActivityRecord = {
  record_id: number;
  activity_id: number;
  timestamp: string;
  power?: number;
  heart_rate?: number;
  cadence?: number;
  speed?: number;
  latitude?: number;
  longitude?: number;
  altitude?: number;
};

export type Activity = ActivitySummary & {
  records: ActivityRecord[];
  laps: ActivityLap[];
  device?: Equipment;
  bike?: Equipment;
  shoe?: Equipment;
  trainer?: Equipment;
};

export type ZoneAnalysisData = {
  power_zones: Record<string, number> | null;
  hr_zones: Record<string, number> | null;
  ftp: number | null;
  lthr: number | null;
};

export type DailyPerformanceMetric = {
  id: number;
  athlete_id: number;
  date: string | number;
  ctl: number;
  atl: number;
  tsb: number;
  tss: number | null;
  if_avg: number | null;
};

export type DailyAggregate = {
  date: string;
  total_value: number;
};

export type WeeklyWorkloadDataPoint = {
  week_start_date: string;
  weekly_total: number;
  rolling_avg: number;
  rolling_std_upper: number;
  rolling_std_lower: number;
};

export type WeeklyWorkload = {
  weeks: WeeklyWorkloadDataPoint[];
};

// Recharts component prop interfaces
export interface RechartsTooltipProps {
  active?: boolean;
  payload?: Array<{
    color: string;
    dataKey: string;
    name: string;
    value: number;
    payload: Record<string, unknown>;
  }>;
  label?: string | number;
}

export interface RechartsTickProps {
  x: number;
  y: number;
  payload: {
    value: string | number;
    coordinate: number;
    tickCoord: number;
    isShow: boolean;
  };
  [key: string]: unknown;
}

export interface RechartsBarLabelProps {
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;
  [key: string]: unknown;
}

// Zone details types
export type ZoneDetail = {
  name: string;
  range: string;
  purpose: string;
};

export type ZoneDetails = Record<string, ZoneDetail>;

// --- Visual Activity Log ---
export type DailyActivity = {
  activity_id: number;
  name: string;
  time: string;
};

export type ChartDataPoint = {
  day: string;
  stack_index: number;
  metric_value: number;
  color: string;
  daily_activities: DailyActivity[];
};

export type WeeklyActivityData = {
  week_start_date: string;
  week_end_date: string;
  total_metric: number;
  total_time: number;
  total_distance: number;
  total_load: number;
  chart_data: ChartDataPoint[];
};

export type VisualActivityLogResponse = {
  weeks: WeeklyActivityData[];
};

// API Response types (may differ from domain types)
export type ApiAthleteResponse = Athlete;
export type ApiActivityResponse = Activity;
export type ActivityWithAthlete = ActivitySummary & {
  athlete: AthleteSummary;
};

export type ApiActivitiesResponse = ActivitySummary[];
export type ApiPmcResponse = DailyPerformanceMetric[];
export type ApiMmpCurveResponse = { duration: number; power: number }[];
export type ApiMetricHistoryResponse = AthleteMetric[];
export type ApiZoneAnalysisResponse = ZoneAnalysisData;
export type ApiWeeklyWorkloadResponse = WeeklyWorkload;
export type ApiDailyWorkloadResponse = DailyAggregate[];
export type ApiVisualActivityLogResponse = VisualActivityLogResponse;

// Form payload types
export type ActivityUpdatePayload = {
  name?: string;
  description?: string;
  sport?: string;
  sub_sport?: string;
  ride_type?: string;
  perceived_exertion?: number;
  bike_id?: number | null;
  shoe_id?: number | null;
  device_id?: number | null;
  trainer_id?: number | null;
  trainer_setting?: unknown; // Only when needed for virtual power
};
