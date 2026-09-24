import About from './components/About';
import BeforeAfter from './components/BeforeAfter';
import FAQ from './components/FAQ';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import MobileActionBar from './components/MobileActionBar';
import Navbar from './components/Navbar';
import NotFound from './components/NotFound';
import PrivacyPage from './components/PrivacyPage';
import ServiceArea from './components/ServiceArea';
import ServicesSection from './components/ServicesSection';
import Testimonials from './components/Testimonials';
import WhyAllNeat from './components/WhyAllNeat';
import { useHashRoute } from './hooks/useHashRoute';
import { useLang } from './i18n/LanguageContext';

export default function App() {
  const { t } = useLang();
  const route = useHashRoute();

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {/* Sentinel observed by the Navbar to detect scroll-away-from-top (no scroll listeners). */}
      <div id="top-sentinel" aria-hidden className="h-px w-full" />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-navy-900 focus:px-4 focus:py-2.5 focus:text-white"
      >
        {t.skip}
      </a>

      <Navbar onHome={route === 'home'} />

      <main id="main-content" className="flex-1 pb-16 lg:pb-0">
        {route === 'privacy' && <PrivacyPage />}
        {route === 'not-found' && <NotFound />}
        {route === 'home' && (
          <>
            <Hero />
            <ServicesSection />
            <WhyAllNeat />
            <About />
            <Testimonials />
            <BeforeAfter />
            <HowItWorks />
            <ServiceArea />
            <FAQ />
            <FinalCTA />
          </>
        )}
      </main>

      <Footer />
      <MobileActionBar />
    </div>
  );
}
