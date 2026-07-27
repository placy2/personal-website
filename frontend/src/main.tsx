import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { reportWebVitals } from './reportWebVitals.ts';
import './stylesheets/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Report Core Web Vitals (CLS/LCP/INP/FCP/TTFB). Defaults to logging to the
// console; pass an analytics handler here to collect real-user metrics.
reportWebVitals();
