import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';

export interface StorageSettings {
  maxFileSize: number;
  allowedFileTypes: string[];
  maxDocumentsPerProject: number;
  autoIndexing: boolean;
  maxAvatarSize: number;
  allowedAvatarTypes: string[];
}

/**
 * Hook to fetch storage settings from the API
 * This is a public endpoint, no authentication required
 */
export const useStorageSettings = () => {
  return useQuery<StorageSettings>({
    queryKey: ['storage-settings'],
    queryFn: async () => {
      const response = await api.get('/settings/storage');
      return response.data.settings as StorageSettings;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - settings don't change often
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

