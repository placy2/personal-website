import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, it } from 'vitest';
import Home from './Home';
import About from './About';
import Projects from './Projects';
import Resume from './Resume';
import { expectNoA11yViolations } from '../test/axe';

// Each page's main content is wrapped in a <main> landmark by App at
// runtime, so wrap it here too to give axe an equivalent landmark context.
function renderInMain(ui: ReactElement) {
  return render(<main>{ui}</main>);
}

describe('Page accessibility', () => {
  it('Home page has no WCAG A/AA violations', async () => {
    const { container } = renderInMain(<Home />);
    await expectNoA11yViolations(container);
  });

  it('About page has no WCAG A/AA violations', async () => {
    const { container } = renderInMain(<About />);
    await expectNoA11yViolations(container);
  });

  it('Projects page has no WCAG A/AA violations', async () => {
    const { container } = renderInMain(<Projects />);
    await expectNoA11yViolations(container);
  });

  it('Resume page has no WCAG A/AA violations', async () => {
    const { container } = renderInMain(<Resume />);
    await expectNoA11yViolations(container);
  });
});
