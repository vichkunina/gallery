import type { Artwork } from '../../types';
import {
  getArtworkDisplayName,
  getArtworkMaterials,
  getArtworkMetaLine,
  getArtworkPriceLabel,
  getArtworkSize,
} from '../../utils/artworkDisplay';
import { getArtworkTags } from '../../config/artworkTags';
import {
  getArtworkSaleStatus,
  getArtworkSaleStatusLabel,
  hasExplicitSaleStatus,
} from '../../config/artworkSaleStatus';
import './ArtworkInfo.css';

interface ArtworkInfoProps {
  art: Artwork;
  variant: 'card' | 'lightbox';
  description?: boolean;
}

interface ArtworkFact {
  label: string;
  value: string;
}

function getArtworkFacts(art: Artwork): ArtworkFact[] {
  const facts: ArtworkFact[] = [];
  const materials = getArtworkMaterials(art);
  const size = getArtworkSize(art);
  const price = getArtworkPriceLabel(art.id);
  const tags = getArtworkTags(art.id);
  const saleStatus = getArtworkSaleStatus(art.id);

  if (materials) facts.push({ label: 'Материал', value: materials });
  if (size) facts.push({ label: 'Размер', value: size });
  if (price) facts.push({ label: 'Цена', value: price });
  if (hasExplicitSaleStatus(art.id) && saleStatus !== 'for_sale') {
    facts.push({ label: 'Статус', value: getArtworkSaleStatusLabel(art.id) });
  }
  if (tags.length > 0) {
    facts.push({ label: tags.length === 1 ? 'Тег' : 'Теги', value: tags.join(', ') });
  }

  return facts;
}

export function ArtworkInfo({ art, variant, description = false }: ArtworkInfoProps) {
  const name = getArtworkDisplayName(art);
  const price = getArtworkPriceLabel(art.id);
  const meta = getArtworkMetaLine(art);
  const facts = getArtworkFacts(art);
  const desc = description && art.desc ? art.desc : null;

  if (variant === 'card') {
    const cardDesc = art.desc ? art.desc : null;
    return (
      <div className="artwork-info artwork-info--card">
        <div className="artwork-info__row">
          <span className="artwork-info__name">{name}</span>
          {price && <span className="artwork-info__price">{price}</span>}
        </div>
        {meta && <p className="artwork-info__meta">{meta}</p>}
        {cardDesc && <p className="artwork-info__desc">{cardDesc}</p>}
      </div>
    );
  }

  return (
    <div className="artwork-info artwork-info--lightbox">
      <h3 className="artwork-info__name">{name}</h3>
      {facts.length > 0 && (
        <dl className="artwork-info__facts">
          {facts.map((fact) => (
            <div key={fact.label} className="artwork-info__fact">
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {desc && <p className="artwork-info__desc">{desc}</p>}
    </div>
  );
}
