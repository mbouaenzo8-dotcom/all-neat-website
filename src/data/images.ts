/**
 * Illustrations générées en local par IA (Z-Image Turbo, pipeline ai-studio/projects/allneat_site) et servies
 * depuis /media en WebP responsive. Aucune personne, aucun texte : ce ne sont PAS des photos de chantiers All Neat,
 * et le site les étiquette comme telles (badge « AI illustration » + texte alternatif honnête).
 * Avant la mise en ligne définitive, remplacez-les par de vraies photos fournies par l'entreprise.
 */
import type { Lang } from '../i18n/content';

export interface SiteImage {
  /** Préfixe des fichiers : /media/<name>-<largeur>.webp */
  name: string;
  widths: number[];
  width: number;
  height: number;
  alt: Record<Lang, string>;
}

const portrait = { widths: [480, 768, 1024], width: 1024, height: 1280 };
const landscape = { widths: [640, 960, 1344], width: 1344, height: 1024 };

export const images = {
  hero: {
    name: 'hero-living',
    ...portrait,
    alt: {
      en: 'AI-generated illustration of a bright, spotless living room with a white sofa and navy cushions',
      es: 'Ilustración generada con IA de una sala luminosa e impecable con un sofá blanco y cojines azul marino',
    },
  },
  kitchen: {
    name: 'kitchen',
    ...portrait,
    alt: {
      en: 'AI-generated illustration of an immaculate white kitchen with a folded teal cleaning cloth on the counter',
      es: 'Ilustración generada con IA de una cocina blanca impecable con un paño turquesa doblado sobre la encimera',
    },
  },
  bedroom: {
    name: 'bedroom',
    ...landscape,
    alt: { en: 'AI-generated illustration of a freshly made bedroom in soft daylight', es: 'Ilustración generada con IA de un dormitorio recién arreglado con luz suave' },
  },
  bathroom: {
    name: 'bathroom',
    ...landscape,
    alt: { en: 'AI-generated illustration of a spotless bathroom with a clear glass shower', es: 'Ilustración generada con IA de un baño impecable con ducha de cristal transparente' },
  },
  moveIn: {
    name: 'move-in',
    ...landscape,
    alt: { en: 'AI-generated illustration of an empty, freshly cleaned apartment ready for move-in', es: 'Ilustración generada con IA de un apartamento vacío y recién limpiado, listo para mudarse' },
  },
  office: {
    name: 'office',
    ...landscape,
    alt: { en: 'AI-generated illustration of a tidy, clean modern office', es: 'Ilustración generada con IA de una oficina moderna, ordenada y limpia' },
  },
  windows: {
    name: 'windows',
    ...landscape,
    alt: { en: 'AI-generated illustration of streak-free windows in a sunlit room', es: 'Ilustración generada con IA de ventanas sin marcas en una habitación soleada' },
  },
  exterior: {
    name: 'exterior',
    ...landscape,
    alt: { en: 'AI-generated illustration of a freshly pressure-washed brick patio in front of a colonial house', es: 'Ilustración generada con IA de un patio de ladrillo recién lavado a presión frente a una casa colonial' },
  },
} satisfies Record<string, SiteImage>;

export const heroVideo = { webm: '/media/hero-loop.webm', mp4: '/media/hero-loop.mp4', poster: '/media/hero-poster.webp' };

/** Pièces présentées dans le comparateur avant/après (clé = libellé traduit dans content.beforeAfter.rooms). */
export const comparisonImages: { room: string; image: SiteImage }[] = [
  { room: 'kitchen', image: images.kitchen },
  { room: 'bathroom', image: images.bathroom },
  { room: 'living', image: images.hero },
  { room: 'bedroom', image: images.bedroom },
  { room: 'windows', image: images.windows },
  { room: 'exterior', image: images.exterior },
];
