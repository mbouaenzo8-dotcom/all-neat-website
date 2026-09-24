import { MARK_A_PATH, MARK_SPARKLE_PATH } from './brandPaths';

/** Monogramme All Neat : « A » Bricolage Grotesque + étincelle teal (même signature que l'intro 3D). */
export function LogoMark({ className = 'h-10 w-10', tone = 'navy' }: { className?: string; tone?: 'navy' | 'teal' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden focusable="false">
      <rect width="64" height="64" rx="15" fill={tone === 'navy' ? '#101d2c' : '#0f7d84'} />
      <path d={MARK_A_PATH} fill="#fbfaf6" />
      <path d={MARK_SPARKLE_PATH} fill={tone === 'navy' ? '#6fb8bb' : '#fbfaf6'} />
    </svg>
  );
}

/** Logo complet ; le nom visible sert aussi de nom accessible au lien (pas d'aria-label divergent). */
export default function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark tone={dark ? 'teal' : 'navy'} />
      <span className="leading-none">
        <span className={`block font-display text-[1.15rem] font-semibold ${dark ? 'text-white' : 'text-navy-900'}`}>
          All Neat
        </span>
        <span
          className={`mt-1 block text-[10px] font-semibold uppercase tracking-[0.18em] ${dark ? 'text-teal-200' : 'text-teal-600'}`}
        >
          Cleaning Services
        </span>
      </span>
    </span>
  );
}
