import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/axios';
import type { AnalyticsData, TimeRange } from './analytics/types';
import AnalyticsHeader from './analytics/components/AnalyticsHeader';
import OverviewCards from './analytics/components/OverviewCards';
import StatusCharts from './analytics/components/StatusCharts';
import TaskStats from './analytics/components/TaskStats';
import DocumentsUsers from './analytics/components/DocumentsUsers';
import PerformanceMetrics from './analytics/components/PerformanceMetrics';
import TrendsCharts from './analytics/components/TrendsCharts';
import RecentActivity from './analytics/components/RecentActivity';
import LoadingState from './analytics/components/LoadingState';
import ErrorState from './analytics/components/ErrorState';
import EmptyState from './analytics/components/EmptyState';

export default function Analytics() {
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();
  
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  const { data: analytics, isLoading, isError, refetch } = useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: async () => {
      const response = await api.get(`/analytics?timeRange=${timeRange}`);
      return response.data as AnalyticsData;
    },
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  if (!analytics) {
    return <EmptyState />;
  }

  return (
    <div className="w-full">
      <AnalyticsHeader timeRange={timeRange} onTimeRangeChange={setTimeRange} />
      <OverviewCards analytics={analytics} />
      <StatusCharts analytics={analytics} />
      <TaskStats analytics={analytics} />
      <DocumentsUsers analytics={analytics} />
      <PerformanceMetrics analytics={analytics} />
      <TrendsCharts analytics={analytics} />
      <RecentActivity analytics={analytics} />
    </div>
  );
}
