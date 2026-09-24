import { Phone } from 'lucide-react';
import { business } from '../data/business';
import { services } from '../data/services';
import { useLang } from '../i18n/LanguageContext';
import Logo from './Logo';

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="bg-navy-900 text-navy-200">
      <div className="container-page grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <a href="/" className="inline-block">
            <Logo dark />
          </a>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-navy-200">{t.footer.tagline}</p>
        </div>

        <nav aria-label="Footer">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white">{t.footer.navTitle}</h3>
          <ul className="mt-4 flex flex-col gap-2.5 text-sm">
            {t.nav.links.map((link) => (
              <li key={link.href}>
                <a href={`/${link.href}`} className="text-navy-200 transition-colors hover:text-teal-200">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white">{t.footer.servicesTitle}</h3>
          <ul className="mt-4 flex flex-col gap-2.5 text-sm">
            {services.map((s) => (
              <li key={s.slug}>
                <a href="/#services" className="text-navy-200 transition-colors hover:text-teal-200">
                  {t.services.items[s.slug].name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white">{t.footer.contactTitle}</h3>
          <a
            href={business.phoneHref}
            className="mt-4 flex items-center gap-2 text-sm font-medium text-white transition-colors hover:text-teal-200"
          >
            <Phone size={16} strokeWidth={2} aria-hidden />
            {business.phoneDisplay}
          </a>
          <p className="mt-3 text-sm text-navy-200">{t.footer.area}</p>
          <p className="mt-3 text-sm text-navy-200" lang="es">
            {t.footer.spanish}
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-navy-200 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {business.name}. {t.footer.rights}{' '}
            <a href="#/privacy" className="ml-2 underline-offset-2 hover:text-teal-200 hover:underline">
              {t.footer.privacy}
            </a>
          </p>
          <p className="max-w-xl sm:text-right">{t.footer.prototype}</p>
        </div>
      </div>
    </footer>
  );
}
