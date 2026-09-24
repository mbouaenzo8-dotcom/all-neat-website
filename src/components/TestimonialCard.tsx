import { ExternalLink, Quote, Star } from 'lucide-react';
import type { Testimonial } from '../types';

function Stars({ count }: { count: number }) {
  return (
    <div className="flex text-star-500" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={16} fill="currentColor" strokeWidth={0} />
      ))}
    </div>
  );
}

export default function TestimonialCard({
  testimonial,
  featured = false,
}: {
  testimonial: Testimonial;
  featured?: boolean;
}) {
  if (testimonial.isPlaceholder) {
    return (
      <figure className="flex h-full flex-col rounded-2xl border border-dashed border-navy-200 bg-white p-7 shadow-soft">
        <Quote size={22} className="text-teal-300" aria-hidden />
        <blockquote className="mt-4 flex-1 text-[15px] italic leading-relaxed text-navy-500">
          {testimonial.quote}
        </blockquote>
        <figcaption className="mt-5 flex items-center justify-between border-t border-navy-100 pt-4">
          <span className="text-sm font-semibold text-navy-700">{testimonial.attribution}</span>
          <span className="rounded-full bg-navy-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-navy-500">
            Placeholder
          </span>
        </figcaption>
      </figure>
    );
  }

  return (
    <figure
      className={`flex h-full flex-col rounded-2xl border border-navy-100 bg-white shadow-soft ${
        featured ? 'p-8 sm:p-10' : 'p-7'
      }`}
    >
      <div className="flex items-center justify-between">
        <Stars count={testimonial.stars} />
        <Quote size={featured ? 26 : 20} className="text-teal-200" aria-hidden />
      </div>

      <blockquote
        className={`mt-4 flex-1 leading-relaxed text-navy-700 ${
          featured ? 'text-lg sm:text-xl sm:leading-relaxed' : 'text-[15px]'
        }`}
      >
        {testimonial.quote}
      </blockquote>

      <figcaption className="mt-6 flex items-center justify-between border-t border-navy-100 pt-4">
        <span className="text-sm font-semibold text-navy-800">{testimonial.attribution}</span>
        <a
          href={testimonial.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-teal-700 transition-colors hover:bg-teal-100"
        >
          {testimonial.source}
          <ExternalLink size={11} aria-hidden />
        </a>
      </figcaption>
    </figure>
  );
}
