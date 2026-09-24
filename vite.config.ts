import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import { business } from './src/data/business.ts'
import { serviceAreas } from './src/data/serviceAreas.ts'
import { content } from './src/i18n/content.ts'

/**
 * Domaine public du site. Tant que le vrai domaine n'est pas confirmé par l'entreprise, on garde un .example
 * (volontairement non résolu). Au déploiement : SITE_URL=https://www.le-vrai-domaine.com npm run build
 */
const SITE_URL = (process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://www.allneatcleaning.example').replace(/\/$/, '')

/** Données structurées générées depuis les mêmes sources que le site (aucune donnée non vérifiée : pas de prix, d'adresse ni de note). */
function structuredData() {
  const en = content.en
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
        '@id': `${SITE_URL}/#business`,
        name: business.name,
        alternateName: business.legalNames,
        url: `${SITE_URL}/`,
        telephone: '+1-202-499-4572',
        image: `${SITE_URL}/og-image.jpg`,
        logo: `${SITE_URL}/icons/icon-512.png`,
        description: en.meta.description,
        address: { '@type': 'PostalAddress', addressLocality: 'Silver Spring', addressRegion: 'MD', addressCountry: 'US' },
        areaServed: serviceAreas.flatMap((g) =>
          g.cities.map((c) =>
            c === 'Washington, D.C.'
              ? { '@type': 'AdministrativeArea', name: c }
              : { '@type': 'City', name: `${c}, ${g.state === 'Maryland' ? 'MD' : 'VA'}` },
          ),
        ),
        knowsLanguage: ['en', 'es'],
        makesOffer: Object.values(en.services.items).map((s) => ({
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: s.name, description: s.description },
        })),
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: business.name,
        inLanguage: ['en', 'es'],
        publisher: { '@id': `${SITE_URL}/#business` },
      },
      {
        '@type': 'FAQPage',
        '@id': `${SITE_URL}/#faq`,
        mainEntity: en.faq.items.map((q) => ({
          '@type': 'Question',
          name: q.question,
          acceptedAnswer: { '@type': 'Answer', text: q.answer },
        })),
      },
    ],
  }
}

function siteMeta(): Plugin {
  return {
    name: 'all-neat-site-meta',
    transformIndexHtml(html) {
      return html
        .replaceAll('__SITE_URL__', SITE_URL)
        .replace('<!--STRUCTURED_DATA-->', `<script type="application/ld+json">${JSON.stringify(structuredData())}</script>`)
    },
    generateBundle() {
      const today = new Date().toISOString().slice(0, 10)
      const alt = (href: string) =>
        `<xhtml:link rel="alternate" hreflang="en" href="${SITE_URL}/"/>` +
        `<xhtml:link rel="alternate" hreflang="es" href="${SITE_URL}/?lang=es"/>` +
        `<xhtml:link rel="alternate" hreflang="x-default" href="${href}"/>`
      const url = (loc: string) => `  <url><loc>${loc}</loc><lastmod>${today}</lastmod>${alt(`${SITE_URL}/`)}</url>`
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${url(`${SITE_URL}/`)}\n${url(`${SITE_URL}/?lang=es`)}\n</urlset>\n`,
      })
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), siteMeta()],
})
