import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';

export interface MaintenanceStatus {
  isActive: boolean;
  message: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  duration: number | null;
}

/**
 * Hook to check maintenance mode status
 * This is a public endpoint, no authentication required
 */
export const useMaintenanceStatus = () => {
  return useQuery<MaintenanceStatus>({
    queryKey: ['maintenance-status'],
    queryFn: async () => {
      const response = await api.get('/settings/maintenance-status');
      return response.data as MaintenanceStatus;
    },
    staleTime: 10 * 1000, // 10 seconds - check frequently for maintenance status
    gcTime: 30 * 1000, // 30 seconds (formerly cacheTime)
    retry: 1, // Only retry once on failure
    refetchOnWindowFocus: true, // Refetch when window regains focus
    // Auto-refetch every 15 seconds when maintenance is active to sync with backend
    // This ensures the page automatically updates when maintenance ends
    refetchInterval: (query) => {
      const data = query.state.data;
      // If maintenance is active, refetch every 15 seconds to check if it ended
      // If maintenance is not active, refetch every 30 seconds to check if it started
      return (data?.isActive ? 15 * 1000 : 30 * 1000);
    },
  });
};

