import { ActivityRecord } from './definitions';

export interface BestEffort {
  interval: number;
  power: number;
  wattsPerKg: number | null;
  avgHr: number;
  elevationGain: number;
  startIndex: number;
  endIndex: number;
}

const INTERVALS = [5, 15, 30, 60, 120, 180, 300, 480, 600, 900, 1200, 1800];

export function calculateBestEfforts(
  records: ActivityRecord[],
  weight: number | null
): BestEffort[] {
  if (!records || records.length < 1) {
    return [];
  }

  const powerData = records.map((r) => r.power ?? 0);
  const bestEfforts: BestEffort[] = [];

  for (const interval of INTERVALS) {
    if (records.length < interval) {
      continue;
    }

    let maxAvgPower = -1;
    let bestStartIndex = -1;

    // Use a sliding window with a running sum for efficiency
    let currentSum = powerData.slice(0, interval).reduce((a, b) => a + b, 0);
    let currentAvg = currentSum / interval;
    maxAvgPower = currentAvg;
    bestStartIndex = 0;

    for (let i = 1; i <= powerData.length - interval; i++) {
      currentSum = currentSum - powerData[i - 1] + powerData[i + interval - 1];
      currentAvg = currentSum / interval;
      if (currentAvg > maxAvgPower) {
        maxAvgPower = currentAvg;
        bestStartIndex = i;
      }
    }

    if (bestStartIndex !== -1) {
      const endIndex = bestStartIndex + interval - 1;
      const effortWindow = records.slice(bestStartIndex, endIndex + 1);

      const avgHr =
        effortWindow.reduce((sum, r) => sum + (r.heart_rate ?? 0), 0) /
        effortWindow.length;

      // Calculate total ascent within the window
      let elevationGain = 0;
      for (let i = 1; i < effortWindow.length; i++) {
        const alt1 = effortWindow[i - 1].altitude;
        const alt2 = effortWindow[i].altitude;
        if (alt1 != null && alt2 != null && alt2 > alt1) {
          elevationGain += alt2 - alt1;
        }
      }

      bestEfforts.push({
        interval,
        power: Math.round(maxAvgPower),
        wattsPerKg: weight
          ? Math.round((maxAvgPower / weight) * 100) / 100
          : null,
        avgHr: Math.round(avgHr),
        elevationGain: Math.round(elevationGain),
        startIndex: bestStartIndex,
        endIndex: endIndex,
      });
    }
  }

  return bestEfforts;
}

export function calculatePowerDistribution(
  records: ActivityRecord[],
  binSize: number = 25
): { range: string; time: number }[] {
  if (!records || records.length === 0) {
    return [];
  }

  const powerData = records.map((r) => r.power ?? 0);
  const maxPower = Math.max(...powerData);
  if (maxPower === 0) return [];

  const numBins = Math.ceil(maxPower / binSize);
  const distribution = Array(numBins).fill(0);

  for (const power of powerData) {
    if (power > 0) {
      const binIndex = Math.floor((power - 1) / binSize);
      if (binIndex < numBins) {
        distribution[binIndex]++;
      }
    }
  }

  return distribution
    .map((time, index) => ({
      range: `${index * binSize + 1}-${(index + 1) * binSize}`,
      time: time,
    }))
    .filter((bin) => bin.time > 0);
}

export function calculateMMP(
  records: ActivityRecord[],
  intervals: number[]
): { duration: number; power: number }[] {
  if (!records || records.length < 1) {
    return [];
  }

  const powerData = records.map((r) => r.power ?? 0);
  const mmpCurve: { duration: number; power: number }[] = [];

  for (const interval of intervals) {
    if (powerData.length < interval) {
      continue;
    }

    let maxAvgPower = -1;

    let currentSum = powerData.slice(0, interval).reduce((a, b) => a + b, 0);
    maxAvgPower = currentSum / interval;

    for (let i = 1; i <= powerData.length - interval; i++) {
      currentSum = currentSum - powerData[i - 1] + powerData[i + interval - 1];
      const currentAvg = currentSum / interval;
      if (currentAvg > maxAvgPower) {
        maxAvgPower = currentAvg;
      }
    }

    mmpCurve.push({ duration: interval, power: Math.round(maxAvgPower) });
  }

  return mmpCurve;
}
