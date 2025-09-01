import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.scrollTo for jsdom
Object.defineProperty(window, 'scrollTo', {
  value: () => {},
  writable: true,
});

// Mock window.addEventListener for resize events
Object.defineProperty(window, 'addEventListener', {
  value: () => {},
  writable: true,
});

// Mock window.removeEventListener
Object.defineProperty(window, 'removeEventListener', {
  value: () => {},
  writable: true,
});

// Mock matchMedia for CSS media queries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
