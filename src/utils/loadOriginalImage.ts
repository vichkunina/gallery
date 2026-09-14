/** Cancel stale requests and callbacks, including a decode already in progress. */
export function loadOriginalImage(src: string, onReady: () => void, onError: () => void): () => void {
  let active = true;
  const image = new Image();
  image.fetchPriority = 'high';
  image.decoding = 'async';
  image.onload = async () => {
    try { await image.decode(); } catch { /* Loaded images may still be displayable. */ }
    if (active) onReady();
  };
  image.onerror = () => { if (active) onError(); };
  image.src = src;
  return () => {
    active = false;
    image.onload = null;
    image.onerror = null;
    if (!image.complete) image.src = '';
  };
}
