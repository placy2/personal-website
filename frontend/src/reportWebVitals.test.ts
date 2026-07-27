import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Metric } from 'web-vitals';

// Mock web-vitals so we can assert each on* subscriber is wired up without a
// real browser performance timeline (jsdom has none).
vi.mock('web-vitals', () => ({
  onCLS: vi.fn(),
  onFCP: vi.fn(),
  onINP: vi.fn(),
  onLCP: vi.fn(),
  onTTFB: vi.fn(),
}));

import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
import { reportWebVitals, consoleReporter } from './reportWebVitals';

describe('reportWebVitals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('subscribes to all five Core Web Vitals', () => {
    const handler = vi.fn();
    reportWebVitals(handler);
    for (const fn of [onCLS, onFCP, onINP, onLCP, onTTFB]) {
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(handler);
    }
  });

  it('defaults to the console reporter when no handler is given', () => {
    reportWebVitals();
    expect(onCLS).toHaveBeenCalledWith(consoleReporter);
  });
});

describe('consoleReporter', () => {
  let info: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    info = vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    info.mockRestore();
  });

  it('logs the metric name, value and rating', () => {
    consoleReporter({ name: 'LCP', value: 1234.5678, rating: 'good' } as Metric);
    expect(info).toHaveBeenCalledTimes(1);
    const message = info.mock.calls[0][0] as string;
    expect(message).toContain('LCP');
    expect(message).toContain('good');
    expect(message).toContain('1234.568');
  });
});
