'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  DailyPerformanceMetric,
  AthleteMetric,
  ApiPmcResponse,
  ApiMmpCurveResponse,
  ApiMetricHistoryResponse,
} from '@/lib/definitions';
import { config } from '@/lib/config';
import {
  PerformanceManagementChart,
  MmpCurveChart,
  FtpProgressionChart,
  WeightTrendChart,
} from '@/components/charts';
import { MetricGauge } from '@/components';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
} from '@/components/ui';

const API_URL = config.apiUrl;

export default function PerformancePage() {
  const params = useParams();
  const athleteId = params.id as string;

  // State for date range
  const [endDate, setEndDate] = useState(new Date());
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 89); // Default to last 90 days
    return date;
  });

  // State for fetched data
  const [pmcData, setPmcData] = useState<DailyPerformanceMetric[]>([]);
  const [mmpData, setMmpData] = useState<{ duration: number; power: number }[]>(
    []
  );
  const [ftpHistory, setFtpHistory] = useState<AthleteMetric[]>([]);
  const [weightHistory, setWeightHistory] = useState<AthleteMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!athleteId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];

      try {
        const [pmcRes, mmpRes, ftpRes, weightRes] = await Promise.all([
          fetch(
            `${API_URL}/athlete/${athleteId}/pmc?start_date=${start}&end_date=${end}`
          ),
          fetch(
            `${API_URL}/athlete/${athleteId}/mmp-curve?start_date=${start}&end_date=${end}`
          ),
          fetch(
            `${API_URL}/athlete/${athleteId}/metric-history?metric_type=ftp`
          ),
          fetch(
            `${API_URL}/athlete/${athleteId}/metric-history?metric_type=weight`
          ),
        ]);

        if (!pmcRes.ok) throw new Error('Failed to fetch PMC data');
        if (!mmpRes.ok) throw new Error('Failed to fetch MMP data');
        if (!ftpRes.ok) throw new Error('Failed to fetch FTP history');
        if (!weightRes.ok) throw new Error('Failed to fetch weight history');

        setPmcData((await pmcRes.json()) as ApiPmcResponse);
        setMmpData((await mmpRes.json()) as ApiMmpCurveResponse);
        setFtpHistory((await ftpRes.json()) as ApiMetricHistoryResponse);
        setWeightHistory((await weightRes.json()) as ApiMetricHistoryResponse);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'An unknown error occurred.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [athleteId, startDate, endDate]);

  const setDateRange = (pastDays: number, futureDays: number = 0) => {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - (pastDays - 1));
    const end = new Date();
    end.setDate(today.getDate() + futureDays);

    setStartDate(start);
    setEndDate(end);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  const latestMetric =
    pmcData.find((d) => d.date === todayStr) ||
    (pmcData.length > 0 ? pmcData[pmcData.length - 1] : null);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-6 text-foreground">
          Performance Management
        </h1>

        {/* Metric Gauges */}
        {latestMetric && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <Card>
              <CardContent className="p-4">
                <MetricGauge metricType="ctl" currentValue={latestMetric.ctl} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <MetricGauge metricType="atl" currentValue={latestMetric.atl} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <MetricGauge metricType="tsb" currentValue={latestMetric.tsb} />
              </CardContent>
            </Card>
          </div>
        )}

        {loading && (
          <p className="text-center text-muted-foreground">
            Loading performance data...
          </p>
        )}
        {error && (
          <p className="text-center text-destructive">Error: {error}</p>
        )}

        {!loading && !error && (
          <div className="space-y-8">
            {/* Date Range Selector */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Date Range:
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setDateRange(7, 3)}
                  >
                    7 Days
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setDateRange(28, 7)}
                  >
                    28 Days
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setDateRange(90, 15)}
                  >
                    90 Days
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setDateRange(180, 28)}
                  >
                    180 Days
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const start = new Date(new Date().getFullYear(), 0, 1);
                      setStartDate(start);
                      const end = new Date();
                      end.setDate(end.getDate() + 90);
                      setEndDate(end);
                    }}
                  >
                    This Year
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Management Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <PerformanceManagementChart data={pmcData} />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Mean Maximal Power (MMP) Curve</CardTitle>
                </CardHeader>
                <CardContent>
                  <MmpCurveChart data={mmpData} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Power Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    [Power Profile Chart Placeholder]
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>FTP Progression</CardTitle>
                </CardHeader>
                <CardContent>
                  <FtpProgressionChart data={ftpHistory} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Weight Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <WeightTrendChart data={weightHistory} />
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Time in Power Zones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    [Time in Zones Chart Placeholder]
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Aerobic Decoupling (Pw:HR)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    [Aerobic Decoupling Chart Placeholder]
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
