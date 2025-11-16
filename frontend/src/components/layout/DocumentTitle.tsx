import { useEffect } from 'react';
import { useGeneralSettings } from '../../hooks/useGeneralSettings';

/**
 * Component to dynamically update document title based on general settings
 */
export default function DocumentTitle() {
  const { data: settings } = useGeneralSettings();

  useEffect(() => {
    if (settings?.systemName) {
      document.title = settings.systemName;
    }
  }, [settings?.systemName]);

  return null;
}

