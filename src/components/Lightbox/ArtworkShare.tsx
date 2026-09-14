import { useState } from 'react';
import { buildWorkShareUrl } from '../../utils/galleryUrl';

export function ArtworkShare({ workId, title }: { workId: number; title: string }) {
  const [copied, setCopied] = useState(false);
  const [manual, setManual] = useState(false);
  const [busy, setBusy] = useState(false);
  const url = buildWorkShareUrl(workId);

  const share = async () => {
    setBusy(true);
    try {
      if (navigator.share) {
        try {
          await navigator.share({ title, url });
          return;
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') return;
        }
      }
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      } catch {
        setManual(true);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lightbox__share">
      <button type="button" onClick={share} disabled={busy}>Поделиться ↗</button>
      <span role="status">{copied ? 'Ссылка скопирована' : ''}</span>
      {manual && <input aria-label="Ссылка на картину — скопируйте вручную" value={url} readOnly onFocus={(event) => event.currentTarget.select()} />}
    </div>
  );
}
