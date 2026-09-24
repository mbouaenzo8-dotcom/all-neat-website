import { Phone } from 'lucide-react';
import { business } from '../data/business';
import { useLang } from '../i18n/LanguageContext';
import Button from './Button';
import QuoteForm from './QuoteForm';
import Reveal from './Reveal';

export default function FinalCTA() {
  const { t } = useLang();
  return (
    <section id="contact" className="section-y bg-mist-50" aria-labelledby="contact-title">
      <div className="container-page grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-start">
        <Reveal>
          <div className="lg:sticky lg:top-28">
            <h2
              id="contact-title"
              className="text-balance font-display text-[1.9rem] font-semibold leading-[1.08] text-navy-900 sm:text-4xl lg:text-[2.5rem]"
            >
              {t.contact.title}
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-navy-500">{t.contact.lead}</p>
            <div className="mt-8">
              <Button href={business.phoneHref} variant="secondary">
                <Phone size={18} strokeWidth={2} aria-hidden />
                {t.contact.call} {business.phoneDisplay}
              </Button>
            </div>
            <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-navy-100 pt-8 text-sm">
              {t.contact.facts.map((f) => (
                <div key={f.term}>
                  <dt className="font-semibold text-navy-800">{f.term}</dt>
                  <dd className="mt-1 text-navy-500">{f.detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <QuoteForm />
        </Reveal>
      </div>
    </section>
  );
}
