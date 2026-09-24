/**
 * Tous les textes du site, en anglais et en espagnol (le service en espagnol est un fait vérifié).
 * Même règle d'intégrité que CONTENT-NOTES.md : aucun fait non vérifié (pas de prix, d'horaires, d'adresse,
 * de certifications ni de délais de réponse). Les avis Google restent verbatim, en anglais (src/data/testimonials.ts).
 */
import type { Service } from '../types/index.ts';

export type Lang = 'en' | 'es';

type ServiceText = Pick<Service, 'name' | 'summary' | 'description' | 'bullets'>;

export interface SiteContent {
  meta: { title: string; description: string };
  skip: string;
  imageNote: string;
  aiBadge: string;
  nav: { links: { label: string; href: string }[]; cta: string; openMenu: string; closeMenu: string; switchTo: string };
  hero: {
    badge: string;
    titleStart: string;
    titleHighlight: string;
    titleEnd: string;
    lead: string;
    cta: string;
    call: string;
    rating: string;
    trust: string[];
  };
  services: {
    title: string;
    description: string;
    requestQuote: string;
    items: Record<string, ServiceText>;
  };
  why: { title: string; description: string; points: { title: string; description: string }[] };
  about: { title: string; p1: string; p2: string; statLabel: string; experience: string; facts: { title: string; text: string }[] };
  reviews: {
    title: string;
    description: string;
    badge: string;
    note: (date: string) => string;
    readMore: string;
    originalLanguage?: string;
  };
  beforeAfter: {
    title: string;
    description: string;
    before: string;
    after: string;
    sliderLabel: (room: string) => string;
    show: (room: string) => string;
    rooms: Record<string, string>;
  };
  how: { title: string; steps: { title: string; description: string }[] };
  area: { title: string; description: string; states: Record<string, string>; notListed: string; cta: string };
  faq: { title: string; intro: string; call: string; items: { question: string; answer: string }[] };
  contact: { title: string; lead: string; call: string; facts: { term: string; detail: string }[] };
  form: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    service: string;
    servicePlaceholder: string;
    serviceOther: string;
    propertyType: string;
    propertyPlaceholder: string;
    propertyTypes: string[];
    date: string;
    contactMethod: string;
    contactPlaceholder: string;
    contactMethods: string[];
    message: string;
    messagePlaceholder: string;
    photos: string;
    photosCta: string;
    photosBySms: string;
    privacy: string;
    privacyLink: string;
    submit: string;
    submitSms: string;
    sending: string;
    required: string;
    errors: { required: string; email: string; phone: string; summary: string; network: string };
    successTitle: string;
    successBody: string;
    smsTitle: string;
    smsBody: string;
    smsIntro: string;
    another: string;
  };
  footer: {
    tagline: string;
    navTitle: string;
    servicesTitle: string;
    contactTitle: string;
    area: string;
    spanish: string;
    rights: string;
    prototype: string;
    privacy: string;
  };
  mobileBar: { call: string; text: string; estimate: string };
  privacy: { title: string; updated: string; draft: string; back: string; sections: { heading: string; body: string }[] };
  notFound: { title: string; body: string; home: string };
}

const phone = '(202) 499-4572';

export const content: Record<Lang, SiteContent> = {
  en: {
    meta: {
      title: 'All Neat Cleaning Services | House & Commercial Cleaning in Silver Spring, MD',
      description:
        'Residential and commercial cleaning, deep cleaning, move-in/move-out cleaning, window cleaning and pressure washing in Silver Spring, MD and the greater Washington, D.C. area. Free estimates. Se habla español.',
    },
    skip: 'Skip to main content',
    imageNote: 'AI-generated illustration, not an actual All Neat job.',
    aiBadge: 'AI illustration',
    nav: {
      links: [
        { label: 'Services', href: '#services' },
        { label: 'About', href: '#about' },
        { label: 'Reviews', href: '#reviews' },
        { label: 'Service area', href: '#service-area' },
        { label: 'FAQ', href: '#faq' },
      ],
      cta: 'Get a free estimate',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      switchTo: 'Ver en español',
    },
    hero: {
      badge: 'Silver Spring, MD and the DC metro area',
      titleStart: 'Professional cleaning. A ',
      titleHighlight: 'fresh start',
      titleEnd: ' every time.',
      lead: 'Residential and commercial cleaning for Silver Spring and the greater Washington, D.C. area. Free estimates, flexible scheduling, careful work.',
      cta: 'Get a free estimate',
      call: 'Call',
      rating: 'Highly rated by local customers',
      trust: ['Highly rated by local customers', 'Free, no-obligation estimates', 'Residential & commercial', 'Veteran-owned & operated'],
    },
    services: {
      title: 'Cleaning services built around your space',
      description:
        'From recurring house cleaning to offices and exterior surfaces, All Neat handles a wide range of cleaning jobs across the DC metro area.',
      requestQuote: 'Request a quote',
      items: {
        'residential-cleaning': {
          name: 'Residential Cleaning',
          summary: 'Recurring or one-time house cleaning tailored to your home and schedule.',
          description: 'Routine and one-time house cleaning for homes of all sizes, scheduled around your life and your priorities.',
          bullets: ['Weekly, bi-weekly, or monthly visits', 'One-time cleanings', 'Kitchens, bathrooms, living areas & bedrooms'],
        },
        'deep-cleaning': {
          name: 'Deep Cleaning',
          summary: 'A more thorough, detail-focused clean for homes that need extra attention.',
          description: 'A detailed top-to-bottom clean that goes beyond routine upkeep, ideal for a seasonal reset or before hosting.',
          bullets: ['Detailed attention to trim, fixtures & baseboards', 'Kitchen & bathroom deep clean', 'Great as a one-time reset'],
        },
        'move-in-move-out-cleaning': {
          name: 'Move-In / Move-Out Cleaning',
          summary: 'A thorough clean timed around your move, for the home you are leaving or the one you are starting in.',
          description: 'Help getting a property move-in or move-out ready, timed to fit your closing date or lease schedule.',
          bullets: ['Move-in ready cleaning', 'Move-out / end-of-lease cleaning', 'Flexible scheduling around your move date'],
        },
        'commercial-cleaning': {
          name: 'Commercial Cleaning',
          summary: 'Cleaning for offices and commercial spaces, scheduled to fit your business hours.',
          description: 'Cleaning for offices, commercial spaces, and facilities, with scheduling built around your business operations.',
          bullets: ['Offices & commercial facilities', 'Recurring janitorial-style service', 'Custom cleaning projects'],
        },
        'window-cleaning': {
          name: 'Window Cleaning',
          summary: 'Interior and exterior window cleaning to bring in the light.',
          description: 'Window cleaning to keep glass surfaces clear inside and out.',
          bullets: ['Residential & commercial windows', 'Interior and exterior glass'],
        },
        'pressure-washing': {
          name: 'Pressure Washing',
          summary: 'Pressure washing and soft-wash service for exterior surfaces.',
          description: 'Exterior pressure washing and soft-wash cleaning to refresh driveways, siding, patios, and other outdoor surfaces.',
          bullets: ['Driveways & walkways', 'Siding & exterior surfaces', 'Patios & decks'],
        },
      },
    },
    why: {
      title: 'What customers consistently point to',
      description: "These themes come up again and again in customer feedback about All Neat's residential and commercial work.",
      points: [
        { title: 'Attention to detail', description: 'Customers consistently describe the team as thorough and careful with the details.' },
        { title: 'Reliable scheduling', description: 'Punctuality and dependability are recurring themes in customer feedback.' },
        { title: 'Professional service', description: 'A professional, friendly team that customers rely on for repeat visits.' },
        { title: 'Responsive communication', description: 'Customers point to clear communication and responsive follow-up.' },
        { title: 'Customized solutions', description: 'Residential and commercial cleaning built around the specifics of your space.' },
        { title: 'Customer-focused', description: 'Customers who are happy with the result and recommend the service to others.' },
      ],
    },
    about: {
      title: 'A local cleaning company focused on getting the details right',
      p1: "All Neat Cleaning Services works with homeowners, families, and businesses across Silver Spring and the greater DC metro area, offering both residential and commercial cleaning. The team handles everything from routine recurring cleaning to move-out cleaning, office cleaning, and exterior work like window cleaning and pressure washing, with scheduling built around each customer's situation.",
      p2: 'Every estimate is free, so you can see what a cleaning plan would look like before committing to anything.',
      statLabel: 'Years of local experience, per public listings',
      experience: 'Residential and commercial cleaning experience',
      facts: [
        { title: 'Locally based', text: 'In Silver Spring, serving the greater DC metro area' },
        { title: 'Veteran-owned', text: 'Owned and operated by a veteran' },
        { title: 'Se habla español', text: 'Spanish-language service available' },
      ],
    },
    reviews: {
      title: 'Trusted by local homeowners and businesses',
      description: 'Recurring themes in customer feedback include professionalism, punctuality, thorough cleaning, and responsive communication.',
      badge: 'Highly rated by local customers on Google',
      note: (date) =>
        `These are real, attributed Google reviews for All Neat, verified against the public review page linked below as of ${date}. They are a snapshot, not a live feed. For the current full set of reviews and rating, see the source.`,
      readMore: 'Read more reviews',
    },
    beforeAfter: {
      title: 'See the difference a detailed clean makes',
      description:
        'Example only: the images are AI-generated illustrations and the "before" side is a simulated filter, not a real All Neat job. Real before-and-after photos will appear here once the business provides them.',
      before: 'Before',
      after: 'After',
      sliderLabel: (room) => `Adjust the before and after comparison for ${room}`,
      show: (room) => `Show ${room} comparison`,
      rooms: { kitchen: 'Kitchen', bathroom: 'Bathroom', living: 'Living room', bedroom: 'Bedroom', windows: 'Windows', exterior: 'Exterior' },
    },
    how: {
      title: 'Getting started is simple',
      steps: [
        { title: 'Request a free estimate', description: 'Tell us about your space and what you need. Estimates are free with no obligation.' },
        { title: 'Discuss your cleaning needs', description: 'We go over scope, scheduling, and any details specific to your home or business.' },
        { title: 'Enjoy a cleaner space', description: 'Sit back while your home or workplace gets the attention it deserves.' },
      ],
    },
    area: {
      title: 'Serving Silver Spring and the DC metro area',
      description:
        'All Neat serves Silver Spring, Maryland and the broader Washington, D.C. metropolitan area, including parts of Maryland, Washington, D.C., and Northern Virginia.',
      states: { Maryland: 'Maryland', 'Washington, D.C.': 'Washington, D.C.', 'Northern Virginia': 'Northern Virginia' },
      notListed: "Don't see your city? Reach out anyway. Service areas can change, and All Neat is happy to confirm coverage for your address.",
      cta: 'Check your area',
    },
    faq: {
      title: 'Frequently asked questions',
      intro: 'Answers use only publicly available information. For anything specific to your home or business, request a free estimate.',
      call: 'Call',
      items: [
        { question: 'What cleaning services do you offer?', answer: 'Residential cleaning, deep cleaning, move-in/move-out cleaning, commercial cleaning, window cleaning, and pressure washing. See the Services section above, or request a free estimate to discuss your specific needs.' },
        { question: 'Do you provide free estimates?', answer: 'Yes. All Neat provides free estimates for residential and commercial cleaning projects.' },
        { question: 'Do you offer recurring cleaning?', answer: 'Yes, recurring residential cleaning is available on a schedule that works for you, in addition to one-time cleanings.' },
        { question: 'Do you offer deep cleaning?', answer: 'Yes, deep cleaning is available as a standalone service or ahead of starting a recurring cleaning plan.' },
        { question: 'Do you clean offices and commercial spaces?', answer: 'Yes, All Neat provides commercial cleaning for offices and other commercial spaces.' },
        { question: 'Do you offer window cleaning?', answer: 'Yes, window cleaning is available for residential and commercial properties.' },
        { question: 'Do you offer pressure washing?', answer: 'Yes, pressure washing is available for exterior surfaces such as driveways, siding, and patios.' },
        { question: 'What areas do you serve?', answer: 'Silver Spring, MD and the greater Washington, D.C. metropolitan area, including parts of Maryland, Washington, D.C., and Northern Virginia. Request an estimate to confirm coverage at your address.' },
        { question: 'How can I request an estimate?', answer: `Use the quote request form on this site, or call ${phone}. Both options are free with no obligation.` },
        { question: 'Is Spanish-language service available?', answer: `Yes. Spanish-language service is available. You can switch this site to Spanish with the language button at the top, or call ${phone}.` },
      ],
    },
    contact: {
      title: 'Ready for a cleaner space?',
      lead: 'Tell us what you need and request your free estimate. No obligation, no pressure.',
      call: 'Call',
      facts: [
        { term: 'Service area', detail: 'Silver Spring, MD and the DC metro area' },
        { term: 'Estimates', detail: 'Free, with no obligation' },
        { term: 'Languages', detail: 'English and Spanish' },
        { term: 'Serving', detail: 'Homes and businesses' },
      ],
    },
    form: {
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      phone: 'Phone',
      service: 'Service needed',
      servicePlaceholder: 'Select a service',
      serviceOther: 'Not sure / Other',
      propertyType: 'Property type',
      propertyPlaceholder: 'Select property type',
      propertyTypes: ['House', 'Apartment / Condo', 'Office', 'Other'],
      date: 'Preferred date',
      contactMethod: 'Preferred contact method',
      contactPlaceholder: 'Select a method',
      contactMethods: ['Phone', 'Email', 'Text'],
      message: 'Message / cleaning needs',
      messagePlaceholder: 'Tell us about your space, its size, or anything specific you would like cleaned.',
      photos: 'Upload photos (optional)',
      photosCta: 'Attach photos of the space',
      photosBySms: 'Tip: you can add photos of the space directly in the text message.',
      privacy: 'Your information is used only to prepare your estimate and follow up with you. It is not sold or shared.',
      privacyLink: 'Privacy policy',
      submit: 'Request my free estimate',
      submitSms: 'Send my request by text',
      sending: 'Sending...',
      required: 'required',
      errors: {
        required: 'This field is required.',
        email: 'Enter a valid email address, like name@example.com.',
        phone: 'Enter a 10-digit U.S. phone number.',
        summary: 'Please fix the highlighted fields.',
        network: `We couldn't send your request. Please try again, or call ${phone}.`,
      },
      successTitle: 'Request received',
      successBody: `Thanks for reaching out to All Neat Cleaning Services. Your request was sent and the team will follow up. You can also call ${phone}.`,
      smsTitle: 'Your text message is ready',
      smsBody: `Your messaging app should have opened with your request filled in. Just press send. If it didn't open, text the details below to ${phone} or call.`,
      smsIntro: 'Free estimate request from the All Neat website',
      another: 'Start a new request',
    },
    footer: {
      tagline: 'Residential and commercial cleaning serving Silver Spring, MD and the greater Washington, D.C. metro area.',
      navTitle: 'Navigate',
      servicesTitle: 'Services',
      contactTitle: 'Contact',
      area: 'Silver Spring, MD and the DC metro area',
      spanish: 'Se habla español',
      rights: 'All rights reserved.',
      prototype: 'Website concept pending business approval. Business details should be verified with the owner before publishing.',
      privacy: 'Privacy policy',
    },
    mobileBar: { call: 'Call', text: 'Text', estimate: 'Free estimate' },
    privacy: {
      title: 'Privacy policy',
      updated: 'Last updated: September 2026',
      draft: 'Draft for review by All Neat Cleaning Services before publication.',
      back: 'Back to the home page',
      sections: [
        { heading: 'What we collect', body: 'When you request an estimate, we collect the details you choose to share: your name, email, phone number, the service and property type, your preferred date and contact method, your message, and any photos you attach.' },
        { heading: 'How we use it', body: 'We use this information only to prepare your estimate, contact you about it, and schedule the service you request.' },
        { heading: 'Sharing', body: 'We do not sell or rent your information. It is shared only with the service providers needed to deliver your request to us (such as a form or messaging provider), and only for that purpose.' },
        { heading: 'Cookies and tracking', body: 'This site does not use advertising cookies or cross-site tracking. Your language choice may be remembered in your browser so the site opens in the same language next time.' },
        { heading: 'Your choices', body: `You can ask us to update or delete the information you sent by calling ${phone}.` },
      ],
    },
    notFound: { title: 'Page not found', body: 'The page you are looking for does not exist or has moved.', home: 'Go to the home page' },
  },

  es: {
    meta: {
      title: 'All Neat Cleaning Services | Limpieza residencial y comercial en Silver Spring, MD',
      description:
        'Limpieza residencial y comercial, limpieza profunda, limpieza de mudanza, limpieza de ventanas y lavado a presión en Silver Spring, MD y el área metropolitana de Washington, D.C. Presupuestos gratis. Se habla español.',
    },
    skip: 'Saltar al contenido principal',
    imageNote: 'Ilustración generada con IA, no es un trabajo real de All Neat.',
    aiBadge: 'Ilustración IA',
    nav: {
      links: [
        { label: 'Servicios', href: '#services' },
        { label: 'Nosotros', href: '#about' },
        { label: 'Reseñas', href: '#reviews' },
        { label: 'Zona de servicio', href: '#service-area' },
        { label: 'Preguntas', href: '#faq' },
      ],
      cta: 'Presupuesto gratis',
      openMenu: 'Abrir menú',
      closeMenu: 'Cerrar menú',
      switchTo: 'View in English',
    },
    hero: {
      badge: 'Silver Spring, MD y el área metropolitana de DC',
      titleStart: 'Limpieza profesional. Un ',
      titleHighlight: 'nuevo comienzo',
      titleEnd: ' cada vez.',
      lead: 'Limpieza residencial y comercial en Silver Spring y el área metropolitana de Washington, D.C. Presupuestos gratis, horarios flexibles y un trabajo cuidadoso.',
      cta: 'Pida un presupuesto gratis',
      call: 'Llame al',
      rating: 'Muy bien valorados por clientes locales',
      trust: ['Muy bien valorados por clientes locales', 'Presupuestos gratis y sin compromiso', 'Residencial y comercial', 'Empresa de un veterano'],
    },
    services: {
      title: 'Servicios de limpieza pensados para su espacio',
      description:
        'Desde la limpieza periódica de casas hasta oficinas y superficies exteriores, All Neat se encarga de todo tipo de trabajos de limpieza en el área metropolitana de DC.',
      requestQuote: 'Pedir presupuesto',
      items: {
        'residential-cleaning': {
          name: 'Limpieza residencial',
          summary: 'Limpieza de casas periódica o puntual, adaptada a su hogar y a su horario.',
          description: 'Limpieza periódica o puntual para casas de todos los tamaños, organizada según su vida y sus prioridades.',
          bullets: ['Visitas semanales, quincenales o mensuales', 'Limpiezas puntuales', 'Cocinas, baños, salas y dormitorios'],
        },
        'deep-cleaning': {
          name: 'Limpieza profunda',
          summary: 'Una limpieza más minuciosa y detallada para hogares que necesitan atención extra.',
          description: 'Una limpieza detallada de arriba abajo que va más allá del mantenimiento habitual, ideal para un cambio de temporada o antes de recibir visitas.',
          bullets: ['Atención al detalle en molduras, accesorios y zócalos', 'Limpieza profunda de cocina y baños', 'Ideal como puesta a punto puntual'],
        },
        'move-in-move-out-cleaning': {
          name: 'Limpieza de mudanza',
          summary: 'Una limpieza a fondo coordinada con su mudanza, para la casa que deja o la que estrena.',
          description: 'Ayuda para dejar una propiedad lista para entrar o para entregar, coordinada con su fecha de cierre o de contrato.',
          bullets: ['Limpieza para entrar a vivir', 'Limpieza de salida / fin de contrato', 'Horario flexible según su fecha de mudanza'],
        },
        'commercial-cleaning': {
          name: 'Limpieza comercial',
          summary: 'Limpieza de oficinas y locales comerciales, programada según su horario de trabajo.',
          description: 'Limpieza de oficinas, locales comerciales e instalaciones, con horarios adaptados a la actividad de su empresa.',
          bullets: ['Oficinas e instalaciones comerciales', 'Servicio periódico de mantenimiento', 'Proyectos de limpieza a medida'],
        },
        'window-cleaning': {
          name: 'Limpieza de ventanas',
          summary: 'Limpieza de ventanas por dentro y por fuera para que entre la luz.',
          description: 'Limpieza de ventanas para mantener los cristales transparentes por dentro y por fuera.',
          bullets: ['Ventanas residenciales y comerciales', 'Cristales interiores y exteriores'],
        },
        'pressure-washing': {
          name: 'Lavado a presión',
          summary: 'Lavado a presión y lavado suave para superficies exteriores.',
          description: 'Lavado a presión y lavado suave de exteriores para renovar entradas de auto, revestimientos, patios y otras superficies.',
          bullets: ['Entradas de auto y caminos', 'Revestimientos y superficies exteriores', 'Patios y terrazas'],
        },
      },
    },
    why: {
      title: 'Lo que los clientes destacan una y otra vez',
      description: 'Estos temas aparecen repetidamente en las opiniones de los clientes sobre el trabajo residencial y comercial de All Neat.',
      points: [
        { title: 'Atención al detalle', description: 'Los clientes describen al equipo como minucioso y cuidadoso con los detalles.' },
        { title: 'Puntualidad', description: 'La puntualidad y la fiabilidad son temas recurrentes en las opiniones de los clientes.' },
        { title: 'Servicio profesional', description: 'Un equipo profesional y amable en el que los clientes confían para volver a contratar.' },
        { title: 'Buena comunicación', description: 'Los clientes destacan una comunicación clara y un seguimiento atento.' },
        { title: 'Soluciones a medida', description: 'Limpieza residencial y comercial adaptada a las características de su espacio.' },
        { title: 'Enfoque en el cliente', description: 'Clientes satisfechos con el resultado que recomiendan el servicio a otros.' },
      ],
    },
    about: {
      title: 'Una empresa de limpieza local que cuida cada detalle',
      p1: 'All Neat Cleaning Services trabaja con propietarios, familias y empresas en Silver Spring y el área metropolitana de DC, con servicios de limpieza residencial y comercial. El equipo se encarga de todo, desde la limpieza periódica hasta la limpieza de mudanza, de oficinas y trabajos exteriores como la limpieza de ventanas y el lavado a presión, con horarios adaptados a cada cliente.',
      p2: 'Todos los presupuestos son gratis, para que pueda ver cómo sería su plan de limpieza antes de comprometerse.',
      statLabel: 'Años de experiencia local, según listados públicos',
      experience: 'Experiencia en limpieza residencial y comercial',
      facts: [
        { title: 'Empresa local', text: 'En Silver Spring, al servicio del área metropolitana de DC' },
        { title: 'Empresa de un veterano', text: 'Propiedad de un veterano, que la dirige' },
        { title: 'Se habla español', text: 'Atención en español disponible' },
      ],
    },
    reviews: {
      title: 'La confianza de hogares y empresas de la zona',
      description: 'Entre los temas recurrentes en las opiniones de los clientes: profesionalismo, puntualidad, limpieza minuciosa y buena comunicación.',
      badge: 'Muy bien valorados por clientes locales en Google',
      note: (date) =>
        `Estas son reseñas reales de Google sobre All Neat, con su autor, verificadas con la página pública de reseñas enlazada abajo a fecha de ${date}. Son una instantánea, no un feed en directo. Para ver todas las reseñas y la valoración actual, consulte la fuente.`,
      readMore: 'Ver más reseñas',
      originalLanguage: 'Reseñas originales en inglés, reproducidas sin cambios.',
    },
    beforeAfter: {
      title: 'Vea la diferencia de una limpieza a fondo',
      description:
        'Solo es un ejemplo: las imágenes son ilustraciones generadas con IA y el lado "antes" es un filtro simulado, no un trabajo real de All Neat. Aquí aparecerán fotos reales de antes y después cuando la empresa las proporcione.',
      before: 'Antes',
      after: 'Después',
      sliderLabel: (room) => `Ajustar la comparación antes y después: ${room}`,
      show: (room) => `Mostrar la comparación: ${room}`,
      rooms: { kitchen: 'Cocina', bathroom: 'Baño', living: 'Sala', bedroom: 'Dormitorio', windows: 'Ventanas', exterior: 'Exterior' },
    },
    how: {
      title: 'Empezar es muy sencillo',
      steps: [
        { title: 'Pida un presupuesto gratis', description: 'Cuéntenos sobre su espacio y lo que necesita. El presupuesto es gratis y sin compromiso.' },
        { title: 'Hablemos de lo que necesita', description: 'Revisamos el alcance, el horario y cualquier detalle propio de su casa o empresa.' },
        { title: 'Disfrute de un espacio limpio', description: 'Relájese mientras su casa o su lugar de trabajo recibe la atención que merece.' },
      ],
    },
    area: {
      title: 'Al servicio de Silver Spring y el área metropolitana de DC',
      description:
        'All Neat atiende Silver Spring, Maryland y el área metropolitana de Washington, D.C., incluidas zonas de Maryland, Washington, D.C. y el norte de Virginia.',
      states: { Maryland: 'Maryland', 'Washington, D.C.': 'Washington, D.C.', 'Northern Virginia': 'Norte de Virginia' },
      notListed: '¿No ve su ciudad? Contáctenos de todos modos. Las zonas de servicio pueden cambiar y All Neat le confirmará con gusto si llega a su dirección.',
      cta: 'Consultar mi zona',
    },
    faq: {
      title: 'Preguntas frecuentes',
      intro: 'Las respuestas usan solo información pública. Para cualquier detalle sobre su casa o empresa, pida un presupuesto gratis.',
      call: 'Llame al',
      items: [
        { question: '¿Qué servicios de limpieza ofrecen?', answer: 'Limpieza residencial, limpieza profunda, limpieza de mudanza, limpieza comercial, limpieza de ventanas y lavado a presión. Vea la sección de servicios o pida un presupuesto gratis para hablar de sus necesidades.' },
        { question: '¿Los presupuestos son gratis?', answer: 'Sí. All Neat ofrece presupuestos gratis para proyectos de limpieza residencial y comercial.' },
        { question: '¿Ofrecen limpieza periódica?', answer: 'Sí, hay limpieza residencial periódica con el horario que le convenga, además de limpiezas puntuales.' },
        { question: '¿Ofrecen limpieza profunda?', answer: 'Sí, la limpieza profunda está disponible como servicio independiente o antes de empezar un plan periódico.' },
        { question: '¿Limpian oficinas y locales comerciales?', answer: 'Sí, All Neat ofrece limpieza comercial para oficinas y otros locales.' },
        { question: '¿Ofrecen limpieza de ventanas?', answer: 'Sí, hay limpieza de ventanas para propiedades residenciales y comerciales.' },
        { question: '¿Ofrecen lavado a presión?', answer: 'Sí, hay lavado a presión para superficies exteriores como entradas de auto, revestimientos y patios.' },
        { question: '¿En qué zonas trabajan?', answer: 'Silver Spring, MD y el área metropolitana de Washington, D.C., incluidas zonas de Maryland, Washington, D.C. y el norte de Virginia. Pida un presupuesto para confirmar el servicio en su dirección.' },
        { question: '¿Cómo pido un presupuesto?', answer: `Use el formulario de esta página o llame al ${phone}. Ambas opciones son gratis y sin compromiso.` },
        { question: '¿Atienden en español?', answer: `Sí, se habla español. Puede ver este sitio en español con el botón de idioma de arriba o llamar al ${phone}.` },
      ],
    },
    contact: {
      title: '¿Listo para un espacio más limpio?',
      lead: 'Cuéntenos lo que necesita y pida su presupuesto gratis. Sin compromiso y sin presión.',
      call: 'Llame al',
      facts: [
        { term: 'Zona de servicio', detail: 'Silver Spring, MD y el área de DC' },
        { term: 'Presupuestos', detail: 'Gratis y sin compromiso' },
        { term: 'Idiomas', detail: 'Inglés y español' },
        { term: 'Clientes', detail: 'Hogares y empresas' },
      ],
    },
    form: {
      firstName: 'Nombre',
      lastName: 'Apellido',
      email: 'Correo electrónico',
      phone: 'Teléfono',
      service: 'Servicio que necesita',
      servicePlaceholder: 'Elija un servicio',
      serviceOther: 'No estoy seguro / Otro',
      propertyType: 'Tipo de propiedad',
      propertyPlaceholder: 'Elija el tipo de propiedad',
      propertyTypes: ['Casa', 'Apartamento / Condominio', 'Oficina', 'Otro'],
      date: 'Fecha preferida',
      contactMethod: 'Cómo prefiere que le contactemos',
      contactPlaceholder: 'Elija una opción',
      contactMethods: ['Teléfono', 'Correo electrónico', 'Mensaje de texto'],
      message: 'Mensaje / lo que necesita',
      messagePlaceholder: 'Cuéntenos sobre su espacio, su tamaño o cualquier detalle que quiera que limpiemos.',
      photos: 'Subir fotos (opcional)',
      photosCta: 'Adjuntar fotos del espacio',
      photosBySms: 'Consejo: puede añadir fotos del espacio directamente en el mensaje de texto.',
      privacy: 'Su información se usa solo para preparar su presupuesto y contactarle. No se vende ni se comparte.',
      privacyLink: 'Política de privacidad',
      submit: 'Pedir mi presupuesto gratis',
      submitSms: 'Enviar mi solicitud por mensaje',
      sending: 'Enviando...',
      required: 'obligatorio',
      errors: {
        required: 'Este campo es obligatorio.',
        email: 'Escriba un correo válido, por ejemplo nombre@ejemplo.com.',
        phone: 'Escriba un número de teléfono de EE. UU. de 10 dígitos.',
        summary: 'Revise los campos marcados.',
        network: `No pudimos enviar su solicitud. Inténtelo de nuevo o llame al ${phone}.`,
      },
      successTitle: 'Solicitud recibida',
      successBody: `Gracias por contactar a All Neat Cleaning Services. Su solicitud se envió y el equipo le responderá. También puede llamar al ${phone}.`,
      smsTitle: 'Su mensaje de texto está listo',
      smsBody: `Su aplicación de mensajes debería haberse abierto con su solicitud escrita. Solo tiene que enviarla. Si no se abrió, envíe los datos de abajo por mensaje al ${phone} o llame.`,
      smsIntro: 'Solicitud de presupuesto gratis desde el sitio de All Neat',
      another: 'Nueva solicitud',
    },
    footer: {
      tagline: 'Limpieza residencial y comercial en Silver Spring, MD y el área metropolitana de Washington, D.C.',
      navTitle: 'Navegación',
      servicesTitle: 'Servicios',
      contactTitle: 'Contacto',
      area: 'Silver Spring, MD y el área de DC',
      spanish: 'Se habla español',
      rights: 'Todos los derechos reservados.',
      prototype: 'Concepto de sitio web pendiente de aprobación por la empresa. Los datos deben verificarse con el propietario antes de publicarlo.',
      privacy: 'Política de privacidad',
    },
    mobileBar: { call: 'Llamar', text: 'Mensaje', estimate: 'Presupuesto' },
    privacy: {
      title: 'Política de privacidad',
      updated: 'Última actualización: septiembre de 2026',
      draft: 'Borrador para revisión por All Neat Cleaning Services antes de su publicación.',
      back: 'Volver a la página de inicio',
      sections: [
        { heading: 'Qué información recogemos', body: 'Cuando pide un presupuesto, recogemos los datos que decide compartir: su nombre, correo electrónico, teléfono, el servicio y el tipo de propiedad, la fecha y la forma de contacto que prefiere, su mensaje y las fotos que adjunte.' },
        { heading: 'Para qué la usamos', body: 'Usamos esta información solo para preparar su presupuesto, contactarle sobre él y programar el servicio que solicite.' },
        { heading: 'Con quién la compartimos', body: 'No vendemos ni alquilamos su información. Solo se comparte con los proveedores necesarios para hacernos llegar su solicitud (como un servicio de formularios o de mensajería) y únicamente con ese fin.' },
        { heading: 'Cookies y seguimiento', body: 'Este sitio no usa cookies publicitarias ni seguimiento entre sitios. Su elección de idioma puede guardarse en su navegador para que el sitio se abra en el mismo idioma la próxima vez.' },
        { heading: 'Sus opciones', body: `Puede pedirnos que actualicemos o borremos la información que nos envió llamando al ${phone}.` },
      ],
    },
    notFound: { title: 'Página no encontrada', body: 'La página que busca no existe o se ha movido.', home: 'Ir a la página de inicio' },
  },
};
