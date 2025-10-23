// Client router skeleton (T013) - hash-based, framework-free
export type Route = { path: string; params?: Record<string,string> };
export type RouteHandler = (route: Route) => void;

function parseHash(): Route {
  const raw = (typeof window !== 'undefined' && window.location.hash) || '#/';
  const hash = raw.replace(/^#/, '');
  // Routes: / and /schema/<path>
  if (hash.startsWith('/schema/')) {
    const enc = hash.substring('/schema/'.length);
    const p = decodeURIComponent(enc);
    return { path: '/schema', params: { path: p } };
  }
  return { path: '/' };
}

export function startRouter(onChange: RouteHandler) {
  const notify = () => onChange(parseHash());
  window.addEventListener('hashchange', notify);
  notify();
  return () => window.removeEventListener('hashchange', notify);
}

export function navigateToSchema(relPath: string) {
  const enc = encodeURIComponent(relPath);
  window.location.hash = `#/schema/${enc}`;
}
