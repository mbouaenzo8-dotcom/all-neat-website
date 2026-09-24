import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { content, type Lang, type SiteContent } from './content';

const STORAGE_KEY = 'allneat-lang';

interface LanguageValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: SiteContent;
}

const LanguageContext = createContext<LanguageValue | null>(null);

/** Ordre de priorité : ?lang= dans l'URL (liens partagés, hreflang), choix mémorisé, langue du navigateur. */
function initialLang(): Lang {
  const fromUrl = new URLSearchParams(window.location.search).get('lang');
  if (fromUrl === 'en' || fromUrl === 'es') return fromUrl;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'es') return stored;
  } catch {
    // stockage indisponible (navigation privée, stockage bloqué) : on continue sans
  }
  return navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en';
}

function setMeta(selector: string, value: string) {
  document.querySelector(selector)?.setAttribute('content', value);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const t = content[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t.meta.title;
    setMeta('meta[name="description"]', t.meta.description);
    setMeta('meta[property="og:title"]', t.meta.title);
    setMeta('meta[property="og:description"]', t.meta.description);
    setMeta('meta[property="og:locale"]', lang === 'es' ? 'es_US' : 'en_US');
  }, [lang, t]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // idem : le choix ne sera simplement pas mémorisé
    }
    const url = new URL(window.location.href);
    if (next === 'es') url.searchParams.set('lang', 'es');
    else url.searchParams.delete('lang');
    window.history.replaceState(null, '', url);
  }, []);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang(): LanguageValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLang must be used inside <LanguageProvider>');
  return value;
}
