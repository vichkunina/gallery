import { useState } from 'react';
import './ArtImage.css';

interface ArtImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'eager' | 'lazy';
  fit?: 'cover' | 'contain';
  priority?: boolean;
  onDimensions?: (width: number, height: number) => void;
}

export function ArtImage({
  src,
  alt,
  className = '',
  loading = 'lazy',
  fit = 'cover',
  priority = false,
  onDimensions,
}: ArtImageProps) {
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
        src={src}
        alt={alt}
        loading={priority ? 'eager' : loading}
        decoding="async"
        {...(priority ? { fetchpriority: 'high' as const } : {})}
        onLoad={(event) => {
          setLoaded(true);
          const { naturalWidth, naturalHeight } = event.currentTarget;
          if (naturalWidth > 0 && naturalHeight > 0) {
            onDimensions?.(naturalWidth, naturalHeight);
          }
        }}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
