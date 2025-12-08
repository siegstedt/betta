import React from 'react';

interface ControlBarProps {
  metric: string;
  onMetricChange: (metric: string) => void;
  sportFilter: string;
  onSportFilterChange: (sport: string) => void;
  typeFilter: string;
  onTypeFilterChange: (type: string) => void;
  dateRange: { start: string; end: string };
  onDateRangeChange: (range: { start: string; end: string }) => void;
  onClearFilters: () => void;
  availableSports: string[];
  availableTypes: string[];
}

const METRIC_OPTIONS = [
  { value: 'unified_training_load', label: 'Training Load' },
  { value: 'moving_time', label: 'Moving Time' },
  { value: 'distance', label: 'Distance' },
];

export function ControlBar({
  metric,
  onMetricChange,
  sportFilter,
  onSportFilterChange,
  typeFilter,
  onTypeFilterChange,
  dateRange,
  onDateRangeChange,
  onClearFilters,
  availableSports,
  availableTypes,
}: ControlBarProps) {
  return (
    <div className="p-4 bg-card rounded-lg mb-6">
      {/* Single Row Filters */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Metric Selector */}
        <div className="min-w-8 flex-1">
          <label className="block text-xs font-medium text-card-foreground mb-1">
            Metric
          </label>
          <select
            value={metric}
            onChange={(e) => onMetricChange(e.target.value)}
            className="block w-full px-2 py-2 bg-background border border-input rounded-md shadow-sm text-xs"
          >
            {METRIC_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sport Filter */}
        <div className="min-w-8 flex-1">
          <label className="block text-xs font-medium text-card-foreground mb-1">
            Sport
          </label>
          <select
            value={sportFilter}
            onChange={(e) => onSportFilterChange(e.target.value)}
            className="block w-full px-2 py-2 bg-background border border-input rounded-md shadow-sm text-xs"
          >
            <option value="">All</option>
            {availableSports.map((sport) => (
              <option key={sport} value={sport}>
                {sport.charAt(0).toUpperCase() + sport.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="min-w-8 flex-1">
          <label className="block text-xs font-medium text-card-foreground mb-1">
            Type
          </label>
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value)}
            className="block w-full px-2 py-2 bg-background border border-input rounded-md shadow-sm text-xs"
          >
            <option value="">All</option>
            {availableTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div className="min-w-8 flex-1">
          <label className="block text-xs font-medium text-card-foreground mb-1">
            Date Range
          </label>
          <div className="flex gap-1">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                onDateRangeChange({ ...dateRange, start: e.target.value })
              }
              className="flex-1 px-1 py-2 bg-background border border-input rounded-md shadow-sm text-xs min-w-6"
            />
            <span className="text-muted-foreground self-center text-xs">
              to
            </span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                onDateRangeChange({ ...dateRange, end: e.target.value })
              }
              className="flex-1 px-1 py-2 bg-background border border-input rounded-md shadow-sm text-xs min-w-6"
            />
          </div>
        </div>

        {/* Clear Button */}
        <div className="flex-shrink-0">
          <button
            onClick={onClearFilters}
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-input rounded-md hover:bg-muted transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
