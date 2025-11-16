import { useEffect } from 'react';
import { useGeneralSettings } from '../../hooks/useGeneralSettings';

/**
 * Component to dynamically update favicon based on general settings
 */
export default function DynamicFavicon() {
  const { data: settings } = useGeneralSettings();

  useEffect(() => {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }

    if (settings?.faviconUrl) {
      link.href = settings.faviconUrl;
    } else {
      // Default favicon
      link.href = '/vite.svg';
    }
  }, [settings?.faviconUrl]);

  return null;
}

