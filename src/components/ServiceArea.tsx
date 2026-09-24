import { MapPin } from 'lucide-react';
import { serviceAreas } from '../data/serviceAreas';
import { useLang } from '../i18n/LanguageContext';
import Button from './Button';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';

export default function ServiceArea() {
  const { t } = useLang();
  return (
    <section id="service-area" className="section-y bg-sand-50" aria-labelledby="area-title">
      <div className="container-page">
        <Reveal>
          <SectionHeading id="area-title" align="left" title={t.area.title} description={t.area.description} />
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {serviceAreas.map((group, i) => (
            <Reveal key={group.state} delay={i * 70}>
              <div className="h-full rounded-2xl border border-navy-100 bg-white p-6 shadow-soft">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                    <MapPin size={18} strokeWidth={1.75} aria-hidden />
                  </span>
                  <h3 className="font-display text-base font-semibold text-navy-900">{t.area.states[group.state] ?? group.state}</h3>
                </div>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {group.cities.map((city) => (
                    <li key={city} className="rounded-lg bg-mist-50 px-2.5 py-1 text-[13px] font-medium text-navy-600">
                      {city}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-10 flex flex-col items-start gap-5 rounded-2xl border border-teal-100 bg-teal-50/60 p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-[15px] leading-relaxed text-navy-600">{t.area.notListed}</p>
            <Button href="#contact" className="shrink-0">
              {t.area.cta}
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
