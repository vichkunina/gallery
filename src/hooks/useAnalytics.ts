import { useEffect } from 'react';
import { ANALYTICS_ENABLED } from '../config/analytics';
import { initAnalytics, trackPageView } from '../utils/analytics';

export function useAnalytics() {
  useEffect(() => {
    if (!ANALYTICS_ENABLED) return undefined;

    initAnalytics();
    trackPageView();

    const onNavigate = () => trackPageView();
    window.addEventListener('popstate', onNavigate);
    return () => window.removeEventListener('popstate', onNavigate);
  }, []);
}
