const WORK_PREFIX = 'work';

/** Old share links → current work id (and optional view). */
const LEGACY_WORK_LINKS: Record<string, { workId: number; viewIndex?: number }> = {
  'work/39/3': { workId: 41 },
  'work/26/3': { workId: 43 },
  'work/13/4': { workId: 13, viewIndex: 0 },
  'work/13/1': { workId: 13, viewIndex: 3 },
  'work/14': { workId: 13, viewIndex: 1 },
  'work/14/2': { workId: 13, viewIndex: 2 },
  'work/15': { workId: 13, viewIndex: 0 },
  'work/6/2': { workId: 44, viewIndex: 0 },
  'work/6/3': { workId: 44, viewIndex: 1 },
  'work/18/1': { workId: 18, viewIndex: 1 },
  'work/18/2': { workId: 18, viewIndex: 2 },
  'work/18/3': { workId: 18, viewIndex: 3 },
  'work/18/4': { workId: 18, viewIndex: 4 },
  'work/18/5': { workId: 18, viewIndex: 0 },
  'work/34': { workId: 8, viewIndex: 3 },
  'work/34/1': { workId: 8, viewIndex: 3 },
  'work/34/2': { workId: 8, viewIndex: 4 },
  'work/35/1': { workId: 35, viewIndex: 1 },
  'work/35/2': { workId: 35, viewIndex: 0 },
  'work/35/3': { workId: 35, viewIndex: 0 },
  'work/35/4': { workId: 35, viewIndex: 0 },
  'work/35/5': { workId: 35, viewIndex: 2 },
  'work/35/6': { workId: 35, viewIndex: 3 },
  'work/35/7': { workId: 35, viewIndex: 4 },
  'work/35/8': { workId: 35, viewIndex: 5 },
};

export function isLegacyWorkHash(location: Pick<Location, 'hash'>): boolean {
  const hash = location.hash.replace(/^#/, '');
  return hash in LEGACY_WORK_LINKS;
}

export function parseWorkFromPathname(pathname: string): { workId: number; viewIndex: number } | null {
  const match = pathname.match(/^\/work\/(\d+)(?:\/(\d+))?\/?$/);
  if (!match) return null;
  const workId = Number(match[1]);
  if (!Number.isFinite(workId) || workId <= 0) return null;
  const view = match[2] ? Number(match[2]) : 1;
  const viewIndex = Number.isFinite(view) && view > 0 ? view - 1 : 0;
  return { workId, viewIndex };
}

export function resolveWorkLocation(
  location: Pick<Location, 'hash' | 'pathname'>,
): { workId: number; viewIndex: number } | null {
  const fromPath = parseWorkFromPathname(location.pathname);
  if (fromPath) return fromPath;

  const hash = location.hash.replace(/^#/, '');
  const legacy = LEGACY_WORK_LINKS[hash];
  if (legacy) {
    return { workId: legacy.workId, viewIndex: legacy.viewIndex ?? 0 };
  }

  const workId = parseWorkIdFromLocation(location);
  if (workId === null) return null;
  return { workId, viewIndex: parseWorkViewFromLocation(location) };
}

export function parseWorkIdFromLocation(location: Pick<Location, 'hash'>): number | null {
  const match = location.hash.match(/^#work\/(\d+)(?:\/(\d+))?$/);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function parseWorkViewFromLocation(location: Pick<Location, 'hash'>): number {
  const match = location.hash.match(/^#work\/(\d+)\/(\d+)$/);
  if (!match) return 0;
  const view = Number(match[2]);
  return Number.isFinite(view) && view > 0 ? view - 1 : 0;
}

export function buildWorkSharePath(workId: number, viewIndex = 0, multiView = false): string {
  if (multiView || viewIndex > 0) {
    return `/work/${workId}/${viewIndex + 1}/`;
  }
  return `/work/${workId}/`;
}

export function buildWorkShareUrl(workId: number, viewIndex = 0, multiView = false): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://vichkunina.art';
  return `${origin}${buildWorkSharePath(workId, viewIndex, multiView)}`;
}

export function buildWorkHash(workId: number, viewIndex = 0, multiView = false): string {
  if (multiView || viewIndex > 0) {
    return `#${WORK_PREFIX}/${workId}/${viewIndex + 1}`;
  }
  return `#${WORK_PREFIX}/${workId}`;
}

export function buildWorkUrl(workId: number, viewIndex = 0, multiView = false): string {
  const base = `${window.location.origin}${window.location.pathname}${window.location.search}`;
  return `${base}${buildWorkHash(workId, viewIndex, multiView)}`;
}

export function syncWorkUrl(
  workId: number | null,
  viewIndex = 0,
  mode: 'push' | 'replace' = 'replace',
  multiView = false,
) {
  const base = `${window.location.pathname}${window.location.search}`;
  const next = workId === null ? base : `${base}${buildWorkHash(workId, viewIndex, multiView)}`;
  if (`${window.location.pathname}${window.location.search}${window.location.hash}` === next) return;

  if (mode === 'push') {
    history.pushState({ galleryWork: workId, viewIndex, multiView }, '', next);
  } else {
    history.replaceState({ galleryWork: workId, viewIndex, multiView }, '', next);
  }
}
