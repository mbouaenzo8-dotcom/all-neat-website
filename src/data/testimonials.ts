import type { Testimonial } from '../types';

/**
 * Real, attributed Google reviews for All Neat, verified against the raw HTML
 * of the public review aggregator below (not summarized/paraphrased) on
 * 2026-09-18. Star rating and review counts are intentionally NOT hard-coded
 * here since they change over time; see REVIEWS_SOURCE_URL / Testimonials.tsx.
 *
 * Source: https://reviews.birdeye.com/all-neat-inc-170368831651139
 * (aggregates reviews left on Google for this business)
 */
export const REVIEWS_SOURCE_URL = 'https://reviews.birdeye.com/all-neat-inc-170368831651139';
export const REVIEWS_VERIFIED_DATE = 'September 2026';

export const testimonials: Testimonial[] = [
  {
    isPlaceholder: false,
    quote:
      'Zoila and Claudia did an amazing job! They were very professional, thorough, and paid great attention to detail. Everything was left beautifully clean and organized. They were also friendly, respectful, and pleasant to work with. I’m very happy with their service and would definitely recommend Zoila and Claudia to anyone looking for reliable and high-quality cleaning. Thank you both!',
    attribution: 'Natasha',
    source: 'Google review',
    sourceUrl: REVIEWS_SOURCE_URL,
    stars: 5,
  },
  {
    isPlaceholder: false,
    quote:
      'All Neat Cleaning Services did an incredible job with my home! Their team was thorough, professional, and paid attention to every little detail. Walking into a sparkling clean house was such a wonderful feeling. I couldn’t be happier with the results and will definitely be using them again. Highly recommend!',
    attribution: 'Ron G.',
    source: 'Google review',
    sourceUrl: REVIEWS_SOURCE_URL,
    stars: 5,
  },
  {
    isPlaceholder: false,
    quote:
      'The ladies that came to clean my house were great, the service was done within 2 hours and my place was clean! I would definitely book again.',
    attribution: 'K.',
    source: 'Google review',
    sourceUrl: REVIEWS_SOURCE_URL,
    stars: 5,
  },
  {
    isPlaceholder: false,
    quote:
      'My team, Delma & Ivonne, were outstanding. They left nothing undone...and I’m particular! Bravo. I will definitely be a repeat customer!',
    attribution: 'Angie Bradshaw',
    source: 'Google review',
    sourceUrl: REVIEWS_SOURCE_URL,
    stars: 5,
  },
];
