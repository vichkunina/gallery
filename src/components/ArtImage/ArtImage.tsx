import { useState } from 'react';
import './ArtImage.css';
import { mediaImageSrcSet, mediaImageVariants } from '../../config/media';

interface ArtImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'eager' | 'lazy';
  fit?: 'cover' | 'contain';
  priority?: boolean;
  sizes?: string;
}

export function ArtImage({
  src,
  alt,
  className = '',
  loading = 'lazy',
  fit = 'cover',
  priority = false,
  sizes = "(max-width: 540px) 85vw, (max-width: 900px) 45vw, 30vw",
}: ArtImageProps) {
  const variants = mediaImageVariants(src);
  const dimensions = variants[variants.length - 1];
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const rootClass = [
    'art-image',
    fit === 'contain' && 'art-image--contain',
    loaded && 'art-image--loaded',
    failed && 'art-image--failed',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass}>
      <div className="art-image__skeleton" aria-hidden="true" />
      <img
        className="art-image__img"
        src={variants[1]?.src ?? src}
        srcSet={mediaImageSrcSet(src)}
        sizes={dimensions ? sizes : undefined}
        width={dimensions?.width}
        height={dimensions?.height}
        alt={alt}
        loading={priority ? 'eager' : loading}
        decoding="async"
        {...(priority ? { fetchpriority: 'high' as const } : {})}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
