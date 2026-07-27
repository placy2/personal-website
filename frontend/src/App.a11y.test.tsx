import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import App from './App';
import { expectNoA11yViolations } from './test/axe';

describe('App accessibility', () => {
  it('the full app shell (nav, main, footer) has no WCAG A/AA violations', async () => {
    const { container } = render(<App />);
    await expectNoA11yViolations(container);
  });
});
