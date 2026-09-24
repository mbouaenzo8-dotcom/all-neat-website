import { ArrowLeft } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';

export default function PrivacyPage() {
  const { t } = useLang();
  return (
    <article className="section-y bg-sand-50" aria-labelledby="privacy-title">
      <div className="container-page max-w-3xl">
        <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-800">
          <ArrowLeft size={16} aria-hidden />
          {t.privacy.back}
        </a>
        <h1 id="privacy-title" className="mt-6 font-display text-4xl font-semibold tracking-[-0.02em] text-navy-900 sm:text-5xl">
          {t.privacy.title}
        </h1>
        <p className="mt-3 text-sm text-navy-500">{t.privacy.updated}</p>
        <p className="mt-4 rounded-xl border border-teal-100 bg-teal-50/60 px-4 py-3 text-sm text-navy-600">{t.privacy.draft}</p>
        <div className="mt-10 flex flex-col gap-8">
          {t.privacy.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="font-display text-xl font-semibold text-navy-900">{s.heading}</h2>
              <p className="mt-2 max-w-[65ch] text-[15px] leading-relaxed text-navy-600">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
