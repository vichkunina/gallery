import { ANALYTICS_ENABLED, YANDEX_METRIKA_ID } from '../config/analytics';

type YmQueue = {
  (...args: unknown[]): void;
  a?: unknown[][];
  l?: number;
};

declare global {
  interface Window {
    ym?: YmQueue;
  }
}

const counterId = Number(YANDEX_METRIKA_ID);
let initStarted = false;

function callYm(method: string, ...args: unknown[]) {
  if (!ANALYTICS_ENABLED || !Number.isFinite(counterId)) return;
  window.ym?.(counterId, method, ...args);
}

export function initAnalytics() {
  if (!ANALYTICS_ENABLED || initStarted || typeof window === 'undefined') return;
  initStarted = true;

  const tagUrl = `https://mc.yandex.ru/metrika/tag.js?id=${counterId}`;

  if (!window.ym) {
    const ym: YmQueue = (...args: unknown[]) => {
      (ym.a = ym.a ?? []).push(args);
    };
    ym.l = Date.now();
    window.ym = ym;
  }

  const alreadyLoaded = [...document.scripts].some((script) => script.src === tagUrl);
  if (!alreadyLoaded) {
    const script = document.createElement('script');
    script.async = true;
    script.src = tagUrl;
    document.head.appendChild(script);
  }

  callYm('init', {
    ssr: true,
    webvisor: true,
    clickmap: true,
    accurateTrackBounce: true,
    trackLinks: true,
    referrer: document.referrer,
    url: location.href,
    trackHash: false,
  });
}

export function trackPageView(url = window.location.pathname + window.location.search) {
  callYm('hit', url, { title: document.title, referer: document.referrer });
}

export function trackGoal(
  name: string,
  params?: Record<string, string | number | boolean | null | undefined>,
) {
  if (!params) {
    callYm('reachGoal', name);
    return;
  }

  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null),
  );
  callYm('reachGoal', name, cleaned);
}

export function trackOutboundLink(href: string, label: string) {
  trackGoal('outbound_click', { href, label });
}

export function getMetrikaCounterId(): number | null {
  return ANALYTICS_ENABLED && Number.isFinite(counterId) ? counterId : null;
}
