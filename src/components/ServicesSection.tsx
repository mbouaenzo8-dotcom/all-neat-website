import { images } from '../data/images';
import { services } from '../data/services';
import { useLang } from '../i18n/LanguageContext';
import type { Service } from '../types';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';
import ServiceCard from './ServiceCard';

export default function ServicesSection() {
  const { t } = useLang();
  // Structure (slug, icône, catégorie) dans data/services ; textes traduits dans i18n/content.
  const s = (slug: string): Service => ({ ...services.find((x) => x.slug === slug)!, ...t.services.items[slug] });

  return (
    <section id="services" className="section-y bg-white" aria-labelledby="services-title">
      <div className="container-page">
        <Reveal>
          <SectionHeading id="services-title" align="left" title={t.services.title} description={t.services.description} />
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-6">
          <Reveal className="sm:col-span-2 lg:col-span-3">
            <ServiceCard variant="featured" service={s('residential-cleaning')} image={images.bedroom} className="h-full" />
          </Reveal>
          <Reveal delay={60} className="sm:col-span-2 lg:col-span-3">
            <ServiceCard variant="featured" service={s('deep-cleaning')} image={images.bathroom} className="h-full" />
          </Reveal>

          <Reveal className="lg:col-span-2">
            <ServiceCard service={s('move-in-move-out-cleaning')} image={images.moveIn} className="h-full" />
          </Reveal>
          <Reveal delay={60} className="lg:col-span-2">
            <ServiceCard service={s('commercial-cleaning')} image={images.office} className="h-full" />
          </Reveal>
          <Reveal delay={120} className="sm:col-span-2 lg:col-span-2">
            <ServiceCard service={s('window-cleaning')} image={images.windows} className="h-full" />
          </Reveal>

          <Reveal className="sm:col-span-2 lg:col-span-6">
            <ServiceCard variant="wide" service={s('pressure-washing')} image={images.exterior} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
