import { loadOriginalImage } from '../../utils/loadOriginalImage';
import { useEffect, useState } from 'react';
import { mediaThumbUrl, mediaImageVariants } from '../../config/media';

interface LightboxImageProps {
  src: string;
  alt: string;
  className?: string;
  nextPreviewSrc?: string;
}

/** Show the cached thumbnail until the full-size image has loaded and decoded. */
export function LightboxImage({ src, alt, className = "lightbox__img", nextPreviewSrc }: LightboxImageProps) {
  const previewSrc = mediaImageVariants(src)[1]?.src ?? mediaThumbUrl(src);
  const [attempt, setAttempt] = useState(0);
  const [errorSrc, setErrorSrc] = useState<string | null>(null);
  const [readySrc, setReadySrc] = useState<string | null>(null);
  const [failedPreviewSrc, setFailedPreviewSrc] = useState<string | null>(null);
  const showOriginal = readySrc === src || failedPreviewSrc === previewSrc || previewSrc === src;

  useEffect(() => {
    setErrorSrc(null);
    return loadOriginalImage(src, () => setReadySrc(src), () => setErrorSrc(src));
  }, [src, attempt]);

  useEffect(() => {
    if (readySrc !== src || !nextPreviewSrc) return undefined;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? '')) return undefined;
    // Only one lightweight next preview, and only after the current original is ready.
    const preview = new Image();
    preview.fetchPriority = 'low';
    preview.src = mediaImageVariants(nextPreviewSrc)[1]?.src ?? mediaThumbUrl(nextPreviewSrc);
    return () => { if (!preview.complete) preview.src = ''; };
  }, [readySrc, src, nextPreviewSrc]);

  return (
    <>
    <img
      className={className}
      src={showOriginal ? src : previewSrc}
      alt={alt}
      decoding="async"
      onError={showOriginal ? undefined : () => setFailedPreviewSrc(previewSrc)}
    />
    {readySrc !== src && (
      <div className="lightbox-image__status" role="status">
        {errorSrc === src ? <>
          <span>Не удалось загрузить полное фото.</span>
          <button type="button" onClick={() => { setErrorSrc(null); setAttempt((value) => value + 1); }}>Повторить</button>
        </> : <span>Загружается полное фото…</span>}
      </div>
    )}
    </>
  );
}
