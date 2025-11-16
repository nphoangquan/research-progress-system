import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';

export interface GeneralSettings {
  systemName: string;
  systemDescription: string;
  logoUrl: string | null;
  faviconUrl: string | null;
}

/**
 * Hook to fetch general settings from the API
 * This is a public endpoint, no authentication required
 */
export const useGeneralSettings = () => {
  return useQuery<GeneralSettings>({
    queryKey: ['general-settings'],
    queryFn: async () => {
      const response = await api.get('/settings/general');
      return response.data.settings as GeneralSettings;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - settings don't change often
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

