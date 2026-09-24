import { CalendarCheck, MessageSquareText, Sparkles } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';

const stepIcons = [CalendarCheck, MessageSquareText, Sparkles];

export default function HowItWorks() {
  const { t } = useLang();
  return (
    <section className="section-y bg-white" aria-labelledby="how-title">
      <div className="container-page">
        <Reveal>
          <SectionHeading id="how-title" title={t.how.title} />
        </Reveal>

        <ol className="relative mt-16 grid grid-cols-1 gap-10 sm:grid-cols-3">
          <li className="pointer-events-none absolute left-[16%] right-[16%] top-7 hidden h-px bg-navy-100 sm:block" aria-hidden />
          {t.how.steps.map((step, i) => {
            const Icon = stepIcons[i] ?? Sparkles;
            return (
              <li key={step.title} className="relative">
                <Reveal delay={i * 90} className="flex flex-col items-center text-center">
                  <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-900 text-white">
                    <Icon size={24} strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="mt-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-teal-600">0{i + 1}</span>
                  <h3 className="mt-1.5 font-display text-lg font-semibold text-navy-900">{step.title}</h3>
                  <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-navy-500">{step.description}</p>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
