import { useEffect, useState } from 'react';
import { mediaThumbUrl } from '../../config/media';

interface LightboxImageProps {
  src: string;
  alt: string;
}

/** Show the cached thumbnail until the full-size image has loaded and decoded. */
export function LightboxImage({ src, alt }: LightboxImageProps) {
  const previewSrc = mediaThumbUrl(src);
  const [readySrc, setReadySrc] = useState<string | null>(null);
  const [failedPreviewSrc, setFailedPreviewSrc] = useState<string | null>(null);
  const showOriginal = readySrc === src || failedPreviewSrc === previewSrc || previewSrc === src;

  useEffect(() => {
    if (previewSrc === src) return undefined;

    let active = true;
    const original = new Image();
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

  return (
    <img
      className="lightbox__img"
      src={showOriginal ? src : previewSrc}
      alt={alt}
      decoding="async"
      onError={showOriginal ? undefined : () => setFailedPreviewSrc(previewSrc)}
    />
  );
}
