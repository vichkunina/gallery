import { site } from '../../data/content';
import { stickerZones } from '../../data/stickers';
import { useReveal } from '../../hooks/useReveal';
import { SectionLabel } from '../SectionLabel/SectionLabel';
import { StickerField } from '../Stickers/StickerField';
import './About.css';

export function About() {
  const { ref, visible } = useReveal(0.15);

  return (
    <section
      className={`about${visible ? ' about--visible' : ''}`}
      id="about"
      ref={ref}
    >
      <div className="about__inner">
        <SectionLabel number="01" />

        <div className="about__head">
          <div className="about__title-block sticker-zone">
            <StickerField items={stickerZones.aboutTitle} />
            <h2 className="about__title">Обо мне</h2>
          </div>
          <div className="about__bio">
            {site.bio.map((line, index) => (
              <p key={index} className="about__bio-line">
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
