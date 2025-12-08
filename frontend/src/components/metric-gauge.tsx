'use client';

import { useMemo, useState } from 'react';

// --- Configuration Data for each metric type ---

const GAUGE_CONFIG = {
  ctl: {
    title: 'Current Fitness (CTL)',
    emoji: '🏋️‍♀️',
    subtitle: 'Your Engine Size',
    description:
      "Chronic Training Load (CTL) represents your cumulative training load. A higher CTL means a bigger 'engine' and a greater capacity to handle work, but it also requires more recovery.",
    zones: [
      { name: 'Transition', range: [0, 40], color: 'bg-teal-200' },
      { name: 'Foundational', range: [40, 70], color: 'bg-teal-300' },
      { name: 'Competitive', range: [70, 100], color: 'bg-teal-400' },
      { name: 'Peak', range: [100, 140], color: 'bg-teal-500' }, // Capped at 140 for display
    ],
  },
  atl: {
    title: 'Current Fatigue (ATL)',
    emoji: '😴',
    subtitle: 'Your Recovery Dept',
    description:
      "Acute Training Load (ATL) measures short-term fatigue from recent training. It's not a metric to maximize; it's a metric to manage, especially in relation to your CTL.",
    zones: [
      { name: 'Low', range: [0, 60], color: 'bg-violet-200' },
      { name: 'Moderate', range: [60, 85], color: 'bg-violet-300' },
      { name: 'High', range: [85, 110], color: 'bg-violet-400' },
      { name: 'Danger', range: [110, 150], color: 'bg-violet-500' }, // Capped at 150
    ],
  },
  tsb: {
    title: 'Current Form (TSB)',
    emoji: '⭐',
    subtitle: 'Your Readiness to Perform',
    description:
      "Training Stress Balance (TSB) balances your long-term fitness against your short-term fatigue to answer the question: 'How ready are you to perform?'",
    zones: [
      { name: 'Overload', range: [-45, -30], color: 'bg-orange-500' }, // Capped at -45
      { name: 'Productive', range: [-30, -15], color: 'bg-amber-500' },
      { name: 'Neutral', range: [-15, 10], color: 'bg-slate-400' },
      { name: 'Optimal', range: [10, 25], color: 'bg-lime-400' },
      { name: 'Transition', range: [25, 40], color: 'bg-green-400' }, // Capped at 40
    ],
  },
};

interface MetricGaugeProps {
  metricType: 'ctl' | 'atl' | 'tsb';
  currentValue: number;
}

export default function MetricGauge({
  metricType,
  currentValue,
}: MetricGaugeProps) {
  const config = GAUGE_CONFIG[metricType];
  const [isTooltipVisible, setTooltipVisible] = useState(false);

  const { gaugeMin, totalRange, valuePositionPercent } = useMemo(() => {
    const firstZone = config.zones[0];
    const lastZone = config.zones[config.zones.length - 1];
    const gaugeMin = firstZone.range[0];
    const gaugeMax = lastZone.range[1];
    const totalRange = gaugeMax - gaugeMin;

    // Clamp the value to be within the gauge's visible range for positioning
    const clampedValue = Math.max(gaugeMin, Math.min(currentValue, gaugeMax));
    const valuePositionPercent =
      totalRange > 0 ? ((clampedValue - gaugeMin) / totalRange) * 100 : 0;

    return { gaugeMin, totalRange, valuePositionPercent };
  }, [config.zones, currentValue]);

  const currentZone =
    config.zones.find(
      (z) => currentValue >= z.range[0] && currentValue <= z.range[1]
    ) ||
    (currentValue < config.zones[0].range[0]
      ? config.zones[0]
      : config.zones[config.zones.length - 1]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-card-foreground">
          {config.title} {config.emoji}
        </h3>
        <p className="text-sm font-medium text-muted-foreground">
          {config.subtitle}
        </p>
        <p className="text-xs text-muted-foreground mt-2 h-16">
          {config.description}
        </p>
      </div>

      {/* Gauge and Indicator */}
      <div className="relative pt-12 pb-8 flex-grow">
        {/* Current Value Indicator */}
        <div
          className="absolute z-10 transition-all duration-300"
          style={{
            left: `${valuePositionPercent}%`,
            transform: 'translateX(-50%)',
            top: 0,
          }}
          onMouseEnter={() => setTooltipVisible(true)}
          onMouseLeave={() => setTooltipVisible(false)}
        >
          <div className="relative">
            {isTooltipVisible && (
              <div className="absolute bottom-full mb-2 w-48 p-2 bg-popover text-popover-foreground text-xs rounded-md shadow-lg text-center z-20 border border-border">
                You are currently in the{' '}
                <strong className="font-bold">{currentZone.name}</strong> zone.
              </div>
            )}
            <div className="px-3 py-1 bg-background rounded-md shadow-lg border border-border">
              <span className="font-bold text-lg text-foreground">
                {currentValue.toFixed(0)}
              </span>
            </div>
            <div className="absolute top-full left-1/2 w-px h-6 bg-border -translate-x-1/2"></div>
          </div>
        </div>

        {/* Gauge Bar */}
        <div className="relative w-full h-3 flex rounded-full overflow-hidden mt-6">
          {config.zones.map((zone) => {
            const width =
              totalRange > 0
                ? ((zone.range[1] - zone.range[0]) / totalRange) * 100
                : 0;
            return (
              <div
                key={zone.name}
                className={`h-full ${zone.color}`}
                style={{ width: `${width}%` }}
              />
            );
          })}
        </div>

        {/* Boundary and Zone Labels */}
        <div className="relative w-full h-4 mt-1">
          {config.zones.map((zone) => {
            const boundaryValue = zone.range[0];
            const position =
              totalRange > 0
                ? ((boundaryValue - gaugeMin) / totalRange) * 100
                : 0;
            const zoneWidth =
              totalRange > 0
                ? ((zone.range[1] - zone.range[0]) / totalRange) * 100
                : 0;
            const zoneCenterPosition = position + zoneWidth / 2;

            return (
              <div key={zone.name}>
                {/* Boundary Value */}
                <div
                  className="absolute top-0 -translate-x-1/2"
                  style={{ left: `${position}%` }}
                >
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {boundaryValue}
                  </span>
                </div>
                {/* Zone Name */}
                {zoneWidth > 15 && (
                  <div
                    className="absolute top-full -translate-x-1/2"
                    style={{ left: `${zoneCenterPosition}%` }}
                  >
                    <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase">
                      {zone.name}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
