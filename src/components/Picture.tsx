import type { SiteImage } from '../data/images';
import { useLang } from '../i18n/LanguageContext';

interface Props {
  image: SiteImage;
  sizes: string;
  className?: string;
  /** Image au-dessus de la ligne de flottaison (hero) : chargée tout de suite, en priorité. */
  eager?: boolean;
  /** Texte alternatif vide pour une image purement décorative (ex. vignettes des boutons). */
  decorative?: boolean;
}

/** Image WebP responsive (srcset) avec dimensions intrinsèques pour éviter tout décalage de mise en page. */
export default function Picture({ image, sizes, className = '', eager = false, decorative = false }: Props) {
  const { lang } = useLang();
  const src = (w: number) => `/media/${image.name}-${w}.webp`;
  return (
    <img
      src={src(image.widths[1])}
      srcSet={image.widths.map((w) => `${src(w)} ${w}w`).join(', ')}
      sizes={sizes}
      width={image.width}
      height={image.height}
      alt={decorative ? '' : image.alt[lang]}
      aria-hidden={decorative || undefined}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
      decoding="async"
      className={className}
    />
  );
}
