import { MoveHorizontal } from 'lucide-react';
import { useId, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { comparisonImages } from '../data/images';
import { useLang } from '../i18n/LanguageContext';
import Picture from './Picture';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';

export default function BeforeAfter() {
  const { t } = useLang();
  const [active, setActive] = useState(0);
  const [value, setValue] = useState(50);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const labelId = useId();
  const item = comparisonImages[active];
  const room = t.beforeAfter.rooms[item.room];

  const setFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setValue(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)));
  };
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    setFromClientX(e.clientX);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragging.current) setFromClientX(e.clientX);
  };
  const stop = () => {
    dragging.current = false;
  };

  return (
    <section className="section-y bg-mist-50" aria-labelledby="ba-title">
      <div className="container-page">
        <Reveal>
          <SectionHeading id="ba-title" align="left" title={t.beforeAfter.title} description={t.beforeAfter.description} />
        </Reveal>

        <Reveal delay={80}>
          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_11rem] lg:items-start">
            <div
              ref={trackRef}
              className="relative aspect-[16/10] w-full touch-none select-none overflow-hidden rounded-2xl border border-navy-100 shadow-card"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={stop}
              onPointerCancel={stop}
            >
              <Picture image={item.image} sizes="(min-width: 1024px) 70vw, 100vw" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }} aria-hidden>
                <Picture
                  image={item.image}
                  sizes="(min-width: 1024px) 70vw, 100vw"
                  decorative
                  className="h-full w-full object-cover brightness-90 contrast-75 grayscale sepia-[.2]"
                />
              </div>
              <span className="pointer-events-none absolute left-3 top-3 rounded-md bg-navy-900/75 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                {t.beforeAfter.before}
              </span>
              <span className="pointer-events-none absolute right-3 top-3 rounded-md bg-teal-600/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                {t.beforeAfter.after}
              </span>
              <span className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-navy-900/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/90">
                {t.aiBadge}
              </span>

              <div
                className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(16,29,44,0.25)]"
                style={{ left: `${value}%` }}
              />

              {/* Keyboard control (sr-only, focusable). Mouse/touch use pointer drag on the image. */}
              <label id={labelId} htmlFor="ba-range" className="sr-only">
                {t.beforeAfter.sliderLabel(room)}
              </label>
              <input
                id="ba-range"
                type="range"
                min={0}
                max={100}
                value={Math.round(value)}
                aria-labelledby={labelId}
                onChange={(e) => setValue(Number(e.target.value))}
                className="peer sr-only"
              />
              <div
                className="pointer-events-none absolute top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-teal-600 bg-white shadow-lifted peer-focus-visible:ring-2 peer-focus-visible:ring-teal-500 peer-focus-visible:ring-offset-2"
                style={{ left: `${value}%` }}
              >
                <MoveHorizontal size={18} className="text-teal-700" aria-hidden />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 lg:grid-cols-2">
              {comparisonImages.map((c, i) => (
                <button
                  key={c.room}
                  type="button"
                  onClick={() => {
                    setActive(i);
                    setValue(50);
                  }}
                  aria-pressed={i === active}
                  aria-label={t.beforeAfter.show(t.beforeAfter.rooms[c.room])}
                  className={`relative aspect-square overflow-hidden rounded-xl border-2 transition-colors ${
                    i === active ? 'border-teal-600' : 'border-transparent hover:border-teal-300'
                  }`}
                >
                  <Picture image={c.image} sizes="120px" decorative className="h-full w-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 bg-navy-900/70 py-1 text-center text-[10px] font-semibold text-white">
                    {t.beforeAfter.rooms[c.room]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
