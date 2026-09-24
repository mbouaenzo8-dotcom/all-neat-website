import { AppWindow, ArrowRight, Boxes, Building2, Home, Sparkles, SprayCan } from 'lucide-react';
import type { SiteImage } from '../data/images';
import { useLang } from '../i18n/LanguageContext';
import type { Service } from '../types';
import Picture from './Picture';

const icons = {
  home: Home,
  sparkles: Sparkles,
  boxes: Boxes,
  building: Building2,
  window: AppWindow,
  spray: SprayCan,
} as const;

interface Props {
  service: Service;
  variant?: 'default' | 'featured' | 'wide';
  image?: SiteImage;
  className?: string;
}

function AiBadge() {
  const { t } = useLang();
  return (
    <span className="absolute right-3 top-3 z-10 rounded-md bg-navy-900/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/90 backdrop-blur-sm">
      {t.aiBadge}
    </span>
  );
}

export default function ServiceCard({ service, variant = 'default', image, className = '' }: Props) {
  const { t } = useLang();
  const Icon = icons[service.icon];
  const cta = (
    <>
      {t.services.requestQuote}
      <ArrowRight size={16} className="transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
    </>
  );

  if (variant === 'featured' && image) {
    return (
      <article className={`group relative flex min-h-[21rem] flex-col justify-end overflow-hidden rounded-2xl ${className}`}>
        <Picture
          image={image}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/65 to-navy-900/0" aria-hidden />
        <AiBadge />
        <div className="relative p-7">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/25 backdrop-blur">
            <Icon size={22} strokeWidth={1.75} aria-hidden />
          </span>
          <h3 className="mt-4 font-display text-xl font-semibold text-white">{service.name}</h3>
          <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-navy-100">{service.summary}</p>
          <a href="#contact" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white/95 hover:text-white">
            {cta}
          </a>
        </div>
      </article>
    );
  }

  if (variant === 'wide') {
    return (
      <article
        className={`group grid overflow-hidden rounded-2xl border border-teal-100 bg-teal-50/60 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] ${className}`}
      >
        {image && (
          <div className="relative aspect-[16/10] sm:aspect-auto">
            <Picture image={image} sizes="(min-width: 640px) 40vw, 100vw" className="absolute inset-0 h-full w-full object-cover" />
            <AiBadge />
          </div>
        )}
        <div className="flex flex-col justify-center gap-5 p-7 sm:p-9">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-teal-600 shadow-soft">
              <Icon size={24} strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <h3 className="font-display text-xl font-semibold text-navy-900">{service.name}</h3>
              <p className="mt-1.5 max-w-xl text-[15px] leading-relaxed text-navy-500">{service.description}</p>
            </div>
          </div>
          <a
            href="#contact"
            className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-teal-200 bg-white px-5 py-3 text-sm font-semibold text-teal-700 transition-colors hover:border-teal-500"
          >
            {cta}
          </a>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-soft transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-card ${className}`}
    >
      {image && (
        <div className="relative aspect-[16/10] overflow-hidden">
          <Picture
            image={image}
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
          <AiBadge />
        </div>
      )}
      <div className="flex flex-1 flex-col p-7">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
          <Icon size={24} strokeWidth={1.75} aria-hidden />
        </span>
        <h3 className="mt-5 font-display text-lg font-semibold text-navy-900">{service.name}</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-navy-500">{service.summary}</p>
        <ul className="mt-4 flex flex-1 flex-col gap-2 text-sm text-navy-600">
          {service.bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" aria-hidden />
              {bullet}
            </li>
          ))}
        </ul>
        <a href="#contact" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800">
          {cta}
        </a>
      </div>
    </article>
  );
}
