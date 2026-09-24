import { useEffect, useState } from 'react';
import { Languages, Menu, Phone, X } from 'lucide-react';
import { business } from '../data/business';
import { useLang } from '../i18n/LanguageContext';
import Button from './Button';
import Logo from './Logo';

export default function Navbar({ onHome }: { onHome: boolean }) {
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('');
  // Hors page d'accueil (#/privacy), les ancres doivent ramener à l'accueil.
  const href = (anchor: string) => (onHome ? anchor : `/${anchor}`);

  // Detect scroll-away-from-top with an IntersectionObserver sentinel (no scroll listeners).
  useEffect(() => {
    const sentinel = document.getElementById('top-sentinel');
    if (!sentinel || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Section courante mise en évidence dans la navigation.
  useEffect(() => {
    if (!onHome || typeof IntersectionObserver === 'undefined') return;
    const ids = t.nav.links.map((l) => l.href.slice(1));
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [onHome, t.nav.links]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    if (open) window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const langButton = (
    <button
      type="button"
      onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-navy-200 bg-white/70 px-2.5 py-1.5 text-[13px] font-semibold text-navy-700 transition-colors hover:border-teal-500 hover:text-teal-700"
      lang={lang === 'en' ? 'es' : 'en'}
      aria-label={t.nav.switchTo}
    >
      <Languages size={15} strokeWidth={2} aria-hidden />
      {/* Libellé court sur mobile (il passait sur deux lignes), complet dès 640 px. */}
      <span aria-hidden className="sm:hidden">{lang === 'en' ? 'ES' : 'EN'}</span>
      <span aria-hidden className="hidden sm:inline">{t.nav.switchTo}</span>
    </button>
  );

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-colors duration-300 ${
        scrolled || open ? 'border-navy-100 bg-sand-50/85 shadow-soft backdrop-blur-md' : 'border-transparent bg-transparent'
      }`}
    >
      <nav className="container-page flex items-center justify-between gap-4 py-3" aria-label="Primary">
        <a href={onHome ? '#home' : '/'} className="shrink-0">
          <Logo />
        </a>

        <ul className="hidden items-center gap-6 whitespace-nowrap text-[15px] font-medium text-navy-600 xl:flex">
          {t.nav.links.map((link) => {
            const current = onHome && active === link.href.slice(1);
            return (
              <li key={link.href}>
                <a
                  href={href(link.href)}
                  aria-current={current ? 'true' : undefined}
                  className={`relative py-1 transition-colors hover:text-teal-700 ${current ? 'text-navy-900' : ''}`}
                >
                  {link.label}
                  <span
                    aria-hidden
                    className={`absolute inset-x-0 -bottom-0.5 h-0.5 origin-left rounded-full bg-teal-500 transition-transform duration-300 ${
                      current ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                </a>
              </li>
            );
          })}
        </ul>

        <div className="hidden items-center gap-4 xl:flex">
          {langButton}
          <a
            href={business.phoneHref}
            className="flex items-center gap-2 whitespace-nowrap text-[15px] font-semibold text-navy-700 transition-colors hover:text-teal-700"
          >
            <Phone size={17} strokeWidth={2} aria-hidden />
            {business.phoneDisplay}
          </a>
          <Button href={href('#contact')} variant="primary" className="!px-5 !py-2.5 text-sm">
            {t.nav.cta}
          </Button>
        </div>

        <div className="flex items-center gap-2 xl:hidden">
          {langButton}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg p-2 text-navy-800 transition-colors hover:bg-navy-100"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={24} aria-hidden /> : <Menu size={24} aria-hidden />}
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-navy-100 bg-sand-50 xl:hidden">
          <ul className="container-page flex flex-col py-2 text-base font-medium text-navy-800">
            {t.nav.links.map((link) => (
              <li key={link.href} className="border-b border-navy-100 last:border-none">
                <a href={href(link.href)} className="block py-3.5" onClick={() => setOpen(false)}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="container-page flex flex-col gap-3 pb-6 pt-3">
            <Button href={href('#contact')} variant="primary" onClick={() => setOpen(false)}>
              {t.nav.cta}
            </Button>
            <Button href={business.phoneHref} variant="ghost">
              <Phone size={17} aria-hidden /> {business.phoneDisplay}
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
