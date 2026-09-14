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
  const [readySrc, setReadySrc] = useState<string | null>(null);
  const [failedPreviewSrc, setFailedPreviewSrc] = useState<string | null>(null);
  const showOriginal = readySrc === src || failedPreviewSrc === previewSrc || previewSrc === src;

  useEffect(() => {
    if (previewSrc === src) return undefined;

    let active = true;
    const original = new Image();
    original.fetchPriority = 'high';
    original.decoding = 'async';
    original.onload = async () => {
      try {
        await original.decode();
      } catch {
        // A loaded image can still be displayed if explicit decoding fails.
      }
      if (active) setReadySrc(src);
    };
    original.src = src;

    return () => {
      active = false;
      original.onload = null;
      if (!original.complete) original.src = '';
    };
  }, [src, previewSrc]);

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
    <img
      className={className}
      src={showOriginal ? src : previewSrc}
      alt={alt}
      decoding="async"
      onError={showOriginal ? undefined : () => setFailedPreviewSrc(previewSrc)}
    />
  );
}
