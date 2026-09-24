import { Award, Languages, MapPin, ShieldCheck } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';

const factIcons = [MapPin, ShieldCheck, Languages];

export default function About() {
  const { t } = useLang();
  return (
    <section id="about" className="section-y bg-sand-50" aria-labelledby="about-title">
      <div className="container-page grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <SectionHeading id="about-title" align="left" title={t.about.title} />
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-navy-500">{t.about.p1}</p>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-navy-500">{t.about.p2}</p>
        </Reveal>

        <Reveal delay={120}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex items-center gap-5 rounded-2xl bg-navy-900 p-6 text-white sm:col-span-1">
              <span className="font-display text-5xl font-semibold leading-none text-teal-300 [font-variant-numeric:tabular-nums]">10+</span>
              <span className="text-sm font-medium leading-snug text-navy-100">{t.about.statLabel}</span>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border border-navy-100 bg-white p-6 shadow-soft sm:col-span-1">
              <Award size={22} strokeWidth={1.75} className="text-teal-600" aria-hidden />
              <p className="text-sm font-medium leading-relaxed text-navy-700">{t.about.experience}</p>
            </div>
            {t.about.facts.map(({ title, text }, i) => {
              const Icon = factIcons[i];
              return (
                <div key={title} className="flex flex-col gap-3 rounded-2xl border border-navy-100 bg-white p-6 shadow-soft">
                  <Icon size={22} strokeWidth={1.75} className="text-teal-600" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold text-navy-800">{title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-navy-500">{text}</p>
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
