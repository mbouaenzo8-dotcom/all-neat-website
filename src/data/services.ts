import type { Service } from '../types';

export const services: Service[] = [
  {
    slug: 'residential-cleaning',
    name: 'Residential Cleaning',
    category: 'residential',
    summary: 'Recurring or one-time house cleaning tailored to your home and schedule.',
    description:
      'Routine and one-time house cleaning for homes of all sizes, scheduled around your life and your priorities.',
    bullets: ['Weekly, bi-weekly, or monthly visits', 'One-time cleanings', 'Kitchens, bathrooms, living areas & bedrooms'],
    icon: 'home',
  },
  {
    slug: 'deep-cleaning',
    name: 'Deep Cleaning',
    category: 'residential',
    summary: 'A more thorough, detail-focused clean for homes that need extra attention.',
    description:
      'A detailed top-to-bottom clean that goes beyond routine upkeep, ideal for a seasonal reset or before hosting.',
    bullets: ['Detailed attention to trim, fixtures & baseboards', 'Kitchen & bathroom deep clean', 'Great as a one-time reset'],
    icon: 'sparkles',
  },
  {
    slug: 'move-in-move-out-cleaning',
    name: 'Move-In / Move-Out Cleaning',
    category: 'residential',
    summary: 'A thorough clean timed around your move, for the home you’re leaving or the one you’re starting in.',
    description:
      'Help getting a property move-in or move-out ready, timed to fit your closing date or lease schedule.',
    bullets: ['Move-in ready cleaning', 'Move-out / end-of-lease cleaning', 'Flexible scheduling around your move date'],
    icon: 'boxes',
  },
  {
    slug: 'commercial-cleaning',
    name: 'Commercial Cleaning',
    category: 'commercial',
    summary: 'Cleaning for offices and commercial spaces, scheduled to fit your business hours.',
    description:
      'Cleaning for offices, commercial spaces, and facilities, with scheduling built around your business operations.',
    bullets: ['Offices & commercial facilities', 'Recurring janitorial-style service', 'Custom cleaning projects'],
    icon: 'building',
  },
  {
    slug: 'window-cleaning',
    name: 'Window Cleaning',
    category: 'specialty',
    summary: 'Interior and exterior window cleaning to bring in the light.',
    description: 'Window cleaning services to keep glass surfaces clear inside and out.',
    bullets: ['Residential & commercial windows', 'Interior and exterior glass'],
    icon: 'window',
  },
  {
    slug: 'pressure-washing',
    name: 'Pressure Washing',
    category: 'specialty',
    summary: 'Pressure washing and soft wash service for exterior surfaces.',
    description:
      'Exterior pressure washing and soft-wash cleaning to refresh driveways, siding, patios, and other outdoor surfaces.',
    bullets: ['Driveways & walkways', 'Siding & exterior surfaces', 'Patios & decks'],
    icon: 'spray',
  },
];

export const serviceCategoryLabels: Record<Service['category'], string> = {
  residential: 'Residential',
  commercial: 'Commercial',
  specialty: 'Specialty & Exterior',
};
