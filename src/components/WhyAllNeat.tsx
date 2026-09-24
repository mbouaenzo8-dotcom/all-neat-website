import type { CSSProperties, ReactNode } from 'react';
import { Calendar, Heart, MessageCircle, ShieldCheck, SlidersHorizontal, Target } from 'lucide-react';
import { whyPoints } from '../data/process';
import { useReveal } from '../hooks/useReveal';
import { useLang } from '../i18n/LanguageContext';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';

const icons = {
  target: Target,
  calendar: Calendar,
  badge: ShieldCheck,
  message: MessageCircle,
  sliders: SlidersHorizontal,
  heart: Heart,
} as const;

/** <li> animé directement (un <div> Reveal dans un <ul> rendait la liste invalide pour l'accessibilité). */
function RevealItem({ children, className, delay }: { children: ReactNode; className: string; delay: number }) {
  const ref = useReveal<HTMLLIElement>();
  return (
    <li ref={ref} className={`reveal ${className}`} style={{ ['--reveal-delay']: `${delay}ms` } as CSSProperties}>
      {children}
    </li>
  );
}

export default function WhyAllNeat() {
  const { t } = useLang();
  return (
    <section className="section-y bg-navy-900" aria-labelledby="why-title">
      <div className="container-page">
        <Reveal>
          <SectionHeading id="why-title" tone="dark" align="left" title={t.why.title} description={t.why.description} />
        </Reveal>

        <ul className="mt-14 grid grid-cols-1 gap-x-12 gap-y-10 sm:grid-cols-2">
          {t.why.points.map((point, i) => {
            const Icon = icons[whyPoints[i].icon];
            return (
              <RevealItem
                key={point.title}
                delay={(i % 2) * 70}
                className={`flex gap-4 ${i > 1 ? 'sm:border-t sm:border-white/10 sm:pt-9' : ''}`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/15 text-teal-300 ring-1 ring-teal-400/20">
                  <Icon size={21} strokeWidth={1.75} aria-hidden />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-white">{point.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-navy-100">{point.description}</p>
                </div>
              </RevealItem>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
