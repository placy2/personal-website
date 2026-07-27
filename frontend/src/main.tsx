import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Report Core Web Vitals (CLS/LCP/INP/FCP/TTFB). Defaults to logging to the
// console; pass an analytics handler here to collect real-user metrics.
reportWebVitals();
