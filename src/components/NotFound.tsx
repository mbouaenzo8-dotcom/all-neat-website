import { useLang } from '../i18n/LanguageContext';
import Button from './Button';
import { LogoMark } from './Logo';

export default function NotFound() {
  const { t } = useLang();
  return (
    <section className="section-y bg-sand-50" aria-labelledby="nf-title">
      <div className="container-page flex max-w-xl flex-col items-center text-center">
        <LogoMark className="h-14 w-14" />
        <h1 id="nf-title" className="mt-6 font-display text-4xl font-semibold text-navy-900">
          {t.notFound.title}
        </h1>
        <p className="mt-3 text-navy-500">{t.notFound.body}</p>
        <Button href="/" className="mt-8">
          {t.notFound.home}
        </Button>
      </div>
    </section>
  );
}
