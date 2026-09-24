import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Building2, MapPin, Phone, ShieldCheck, Star } from 'lucide-react';
import { business } from '../data/business';
import { heroVideo, images } from '../data/images';
import { useLang } from '../i18n/LanguageContext';
import Button from './Button';
import Picture from './Picture';
import Reveal from './Reveal';

const trustIcons = [Star, BadgeCheck, Building2, ShieldCheck];

/** Pas de vidéo si l'utilisateur limite les animations ou économise ses données : l'image reste. */
function useAmbientVideo() {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    const update = () => setAllowed(!reduce.matches && !saveData);
    update();
    reduce.addEventListener('change', update);
    return () => reduce.removeEventListener('change', update);
  }, []);
  return allowed;
}

export default function Hero() {
  const { t } = useLang();
  const videoAllowed = useAmbientVideo();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  return (
    <section id="home" className="relative overflow-hidden bg-sand-50">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-teal-100/50 blur-3xl"
      />

      <div className="container-page relative">
        <div className="grid items-center gap-11 pb-14 pt-10 lg:min-h-[calc(100dvh-4.5rem)] lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pb-20 lg:pt-14">
          <div className="max-w-xl">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1.5 text-[13px] font-semibold text-teal-700">
                <MapPin size={15} strokeWidth={2} aria-hidden />
                {t.hero.badge}
              </span>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="mt-5 text-balance font-display text-[2.55rem] font-semibold leading-[1.03] tracking-[-0.03em] text-navy-900 sm:text-5xl lg:text-[3.6rem]">
                {t.hero.titleStart}
                <span className="text-teal-600">{t.hero.titleHighlight}</span>
                {t.hero.titleEnd}
              </h1>
            </Reveal>

            <Reveal delay={140}>
              <p className="mt-5 max-w-[34rem] text-pretty text-lg leading-relaxed text-navy-500">{t.hero.lead}</p>
            </Reveal>

            <Reveal delay={200}>
              <div className="mt-8 flex flex-col gap-3.5 sm:flex-row">
                <Button href="#contact" className="text-base">
                  {t.hero.cta}
                </Button>
                <Button href={business.phoneHref} variant="ghost" className="text-base">
                  <Phone size={18} strokeWidth={2} aria-hidden />
                  {t.hero.call} {business.phoneDisplay}
                </Button>
              </div>
            </Reveal>
          </div>

          {/* Pas de Reveal ici : l'image s'affiche tout de suite (LCP rapide), la vidéo prend le relais une fois prête. */}
          <div className="relative lg:pl-6">
            <div aria-hidden className="absolute -right-4 -top-4 hidden h-24 w-24 rounded-2xl border border-teal-200/70 lg:block" />
            <div className="relative aspect-[5/4] overflow-hidden rounded-2xl bg-mist-100 shadow-lifted sm:aspect-[16/10] lg:aspect-[4/5]">
              <Picture
                image={images.hero}
                sizes="(min-width: 1024px) 40vw, 100vw"
                eager
                className="absolute inset-0 h-full w-full object-cover"
              />
              {videoAllowed && (
                <video
                  ref={videoRef}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${playing ? 'opacity-100' : 'opacity-0'}`}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster={heroVideo.poster}
                  aria-hidden
                  tabIndex={-1}
                  onPlaying={() => setPlaying(true)}
                >
                  <source src={heroVideo.webm} type="video/webm" />
                  <source src={heroVideo.mp4} type="video/mp4" />
                </video>
              )}
              <span className="absolute right-3 top-3 rounded-md bg-navy-900/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/90 backdrop-blur-sm">
                {t.aiBadge}
              </span>
            </div>
            <div className="absolute -bottom-5 left-3 flex items-center gap-3 rounded-2xl border border-navy-100 bg-white/95 p-3 pr-5 shadow-card backdrop-blur sm:left-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <ShieldCheck size={22} strokeWidth={1.75} aria-hidden />
              </span>
              <span className="block">
                <span className="flex text-star-500" aria-hidden>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
                  ))}
                </span>
                <span className="mt-0.5 block text-[13px] font-medium text-navy-500">{t.hero.rating}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-navy-100 bg-white">
        <ul className="container-page grid grid-cols-2 gap-x-6 gap-y-4 py-6 sm:grid-cols-4">
          {t.hero.trust.map((label, i) => {
            const Icon = trustIcons[i];
            return (
              <li key={label} className="flex items-center gap-2.5 text-sm font-medium text-navy-700">
                <Icon size={18} strokeWidth={1.75} className="shrink-0 text-teal-600" aria-hidden />
                {label}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
