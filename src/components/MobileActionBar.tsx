import { CalendarCheck, MessageSquare, Phone } from 'lucide-react';
import { business } from '../data/business';
import { useLang } from '../i18n/LanguageContext';

export default function MobileActionBar() {
  const { t } = useLang();
  return (
    <nav
      aria-label={t.mobileBar.estimate}
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-navy-100 bg-white/95 shadow-lifted backdrop-blur lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <a
        href={business.phoneHref}
        className="flex min-h-14 flex-col items-center justify-center gap-1 border-r border-navy-100 py-2.5 text-navy-700 active:bg-navy-50"
      >
        <Phone size={19} strokeWidth={1.75} aria-hidden />
        <span className="text-[11px] font-semibold">{t.mobileBar.call}</span>
      </a>
      <a
        href={business.smsHref}
        className="flex min-h-14 flex-col items-center justify-center gap-1 border-r border-navy-100 py-2.5 text-navy-700 active:bg-navy-50"
      >
        <MessageSquare size={19} strokeWidth={1.75} aria-hidden />
        <span className="text-[11px] font-semibold">{t.mobileBar.text}</span>
      </a>
      <a
        href="/#contact"
        className="flex min-h-14 flex-col items-center justify-center gap-1 bg-teal-600 py-2.5 text-white active:bg-teal-700"
      >
        <CalendarCheck size={19} strokeWidth={1.75} aria-hidden />
        <span className="text-[11px] font-semibold">{t.mobileBar.estimate}</span>
      </a>
    </nav>
  );
}
