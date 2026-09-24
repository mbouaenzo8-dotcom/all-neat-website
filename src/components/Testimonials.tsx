import { ExternalLink, Star } from 'lucide-react';
import { REVIEWS_SOURCE_URL, REVIEWS_VERIFIED_DATE, testimonials } from '../data/testimonials';
import { useLang } from '../i18n/LanguageContext';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';
import TestimonialCard from './TestimonialCard';

export default function Testimonials() {
  const { t } = useLang();
  const [featured, ...rest] = testimonials;

  return (
    <section id="reviews" className="section-y bg-white" aria-labelledby="reviews-title">
      <div className="container-page">
        <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-end lg:justify-between">
          <Reveal>
            <SectionHeading id="reviews-title" align="left" title={t.reviews.title} description={t.reviews.description} />
          </Reveal>
          <Reveal delay={80}>
            <div className="flex items-center gap-2.5 rounded-full bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700">
              <span className="flex text-star-500" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={15} fill="currentColor" strokeWidth={0} />
                ))}
              </span>
              {t.reviews.badge}
            </div>
          </Reveal>
        </div>

        {t.reviews.originalLanguage && <p className="mt-6 text-sm italic text-navy-500">{t.reviews.originalLanguage}</p>}

        {/* Les avis restent en anglais, verbatim : lang="en" pour les lecteurs d'écran. */}
        <div lang="en" className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Reveal className="lg:col-span-3">
            <TestimonialCard testimonial={featured} featured />
          </Reveal>
          {rest.map((item, i) => (
            <Reveal key={i} delay={i * 70}>
              <TestimonialCard testimonial={item} />
            </Reveal>
          ))}
        </div>

        <div className="mx-auto mt-10 flex max-w-2xl flex-col items-center gap-4 text-center">
          <p className="text-sm text-navy-500">{t.reviews.note(REVIEWS_VERIFIED_DATE)}</p>
          <a
            href={REVIEWS_SOURCE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-navy-200 px-5 py-2.5 text-sm font-semibold text-navy-700 transition-colors hover:border-teal-500 hover:text-teal-700"
          >
            {t.reviews.readMore}
            <ExternalLink size={15} aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}
