import { useEffect, useState } from 'react';

export type Route = 'home' | 'privacy' | 'not-found';

/**
 * Routage minimal par ancre (#/privacy) : fonctionne chez n'importe quel hébergeur statique, sans règle de réécriture.
 * Les ancres de section habituelles (#services, #contact…) restent sur la page d'accueil.
 */
function parse(hash: string): Route {
  if (!hash.startsWith('#/')) return 'home';
  if (hash === '#/privacy') return 'privacy';
  return 'not-found';
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      const next = parse(window.location.hash);
      setRoute(next);
      if (next !== 'home') window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
