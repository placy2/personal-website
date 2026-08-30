import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

/**
 * Handler invoked once per Core Web Vitals metric (CLS, LCP, INP, FCP, TTFB).
 *
 * The default reporter (`consoleReporter`) just logs to the console, which is
 * enough to eyeball field performance locally. Swap in an analytics-backed
 * handler (e.g. one that POSTs to an endpoint or calls `gtag`) to collect
 * real-user metrics in production — the plumbing is intentionally left as a
 * single injection point so no analytics vendor is baked in.
 */
export type ReportHandler = (metric: Metric) => void;

/** Lightweight default: log each metric to the console. */
export const consoleReporter: ReportHandler = metric => {
  console.info(
    `[web-vitals] ${metric.name}: ${Math.round(metric.value * 1000) / 1000} (${metric.rating})`
  );
};

/**
 * Subscribe to all Core Web Vitals and forward each to `onReport`.
 * Call once on app startup. Passing no handler uses `consoleReporter`.
 */
export function reportWebVitals(onReport: ReportHandler = consoleReporter): void {
  onCLS(onReport);
  onFCP(onReport);
  onINP(onReport);
  onLCP(onReport);
  onTTFB(onReport);
}
