const WORK_PREFIX = 'work';

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
