import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App.tsx';
import { reportWebVitals } from './reportWebVitals.ts';
import './stylesheets/index.css';

// Development-only accessibility auditing. @axe-core/react logs WCAG
// violations to the browser console on every render so issues surface
// during local development without shipping any code to production.
if (import.meta.env.DEV) {
  void (async () => {
    const [{ default: React }, { default: ReactDOM }, { default: axe }] = await Promise.all([
      import('react'),
      import('react-dom'),
      import('@axe-core/react'),
    ]);
    await axe(React, ReactDOM, 1000);
  })();
}

const container = document.getElementById('root')!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// Prerendered routes (see scripts/prerender.mjs) ship non-empty markup keyed
// to the route it was built for. Only hydrate when that matches where we
// actually loaded. An unknown path is served dist/index.html's markup as S3's
// 404 error document (and `vite preview` does the same for any extensionless
// path), and hydrating mismatched markup throws a React hydration error.
// Falling back to a plain client render here lets the catch-all route show
// "Page not found" and trades a harmless "container not empty" warning for a
// broken page.
const normalize = (path: string) => (path.length > 1 ? path.replace(/\/+$/, '') : path);
const prerenderedForCurrentRoute =
  container.dataset.prerenderedRoute !== undefined &&
  normalize(container.dataset.prerenderedRoute) === normalize(window.location.pathname);

if (prerenderedForCurrentRoute) {
  hydrateRoot(container, app);
} else {
  createRoot(container).render(app);
}

// Report Core Web Vitals (CLS/LCP/INP/FCP/TTFB). Defaults to logging to the
// console; pass an analytics handler here to collect real-user metrics.
reportWebVitals();
