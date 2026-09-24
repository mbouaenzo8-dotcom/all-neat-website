import { useState } from 'react';
import { ChevronDown, Phone } from 'lucide-react';
import { business } from '../data/business';
import { useLang } from '../i18n/LanguageContext';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';

export default function FAQ() {
  const { t } = useLang();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="section-y bg-white" aria-labelledby="faq-title">
      <div className="container-page grid grid-cols-1 gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
        <Reveal>
          <div className="lg:sticky lg:top-28">
            <SectionHeading id="faq-title" align="left" title={t.faq.title} />
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-navy-500">{t.faq.intro}</p>
            <a href={business.phoneHref} className="mt-6 inline-flex items-center gap-2 text-[15px] font-semibold text-teal-700 hover:text-teal-800">
              <Phone size={18} strokeWidth={2} aria-hidden />
              {t.faq.call} {business.phoneDisplay}
            </a>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="divide-y divide-navy-100 rounded-2xl border border-navy-100 bg-white shadow-soft">
            {t.faq.items.map((faq, index) => {
              const isOpen = openIndex === index;
              const panelId = `faq-panel-${index}`;
              const buttonId = `faq-button-${index}`;
              return (
                <div key={faq.question}>
                  <h3>
                    <button
                      id={buttonId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-mist-50"
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                    >
                      <span className="text-[15px] font-semibold text-navy-800">{faq.question}</span>
                      <ChevronDown
                        size={19}
                        className={`shrink-0 text-teal-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        aria-hidden
                      />
                    </button>
                  </h3>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className={`grid overflow-hidden transition-[grid-template-rows] duration-200 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                  >
                    <div className="overflow-hidden">
                      <p className="max-w-[65ch] px-6 pb-5 text-[15px] leading-relaxed text-navy-500">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
