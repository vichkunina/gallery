import { site } from '../../data/content';
import { formatArtworkPrice } from '../../config/artworkCatalog';
import { stickerZones } from '../../data/stickers';
import { useReveal } from '../../hooks/useReveal';
import { trackOutboundLink } from '../../utils/analytics';
import { SectionLabel } from '../SectionLabel/SectionLabel';
import { StickerField } from '../Stickers/StickerField';
import './Contact.css';

export function Contact() {
  const { ref, visible } = useReveal(0.15);

  return (
    <section
      className={`contact${visible ? ' contact--visible' : ''}`}
      id="contact"
      ref={ref}
    >
      <div className="contact__inner">
        <SectionLabel number="04" />

        <div className="contact__title-block sticker-zone">
          <StickerField items={stickerZones.contactTitle} />
          <h2 className="contact__title">Связаться</h2>
        </div>
        <p className="contact__desc">
          Напишите, если хотите купить работу, заказать картину или просто поговорить об искусстве.
        </p>

        <div className="contact__links">
          {site.contacts.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="contact__link"
              target={item.href.startsWith('http') ? '_blank' : undefined}
              rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              onClick={() => trackOutboundLink(item.href, item.label)}
            >
              <strong className="contact__label">{item.label}</strong>
              <span className="contact__value">{item.value}</span>
            </a>
          ))}
        </div>

        <div className="contact__order sticker-zone">
          <StickerField items={stickerZones.contactOrder} />
          <h3 className="contact__order-title">{site.processTitle}</h3>
          <div className="contact__pricing">
            <p className="contact__pricing-title">{site.orderPricing.title}</p>
            <ul className="contact__pricing-list">
              {site.orderPricing.tiers.map((tier) => (
                <li key={tier.label} className="contact__pricing-item">
                  <span className="contact__pricing-label">{tier.label}</span>
                  <span className="contact__pricing-value">
                    от {formatArtworkPrice(tier.fromRub)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="contact__pricing-note">
              {site.orderPricing.note}{' '}
              <a
                href={site.orderPricing.telegramHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackOutboundLink(site.orderPricing.telegramHref, 'order_telegram')}
              >
                {site.orderPricing.noteLink}
              </a>
              .
            </p>
          </div>
          <div className="contact__order-steps">
            {site.processSteps.map((step) => (
              <article key={step.number} className="contact__order-step">
                <span className="contact__order-num">{step.number}</span>
                <h4 className="contact__order-step-title">{step.title}</h4>
                <p className="contact__order-step-text">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
