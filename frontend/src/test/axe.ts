import axe from 'axe-core';
import { expect } from 'vitest';

/**
 * Runs axe-core against a rendered container and fails the test if any
 * WCAG 2.0/2.1 A or AA violations are found.
 *
 * Only WCAG A/AA tagged rules are run (not axe "best-practice" rules) so
 * the assertions map directly to the standards the site is expected to meet.
 * The color-contrast rule is disabled: it samples rendered pixels via canvas,
 * which jsdom does not implement, so it can only ever report "incomplete" here
 * (and logs a canvas warning per run). Contrast is instead exercised at runtime
 * via @axe-core/react during development.
 */
export async function expectNoA11yViolations(container: HTMLElement): Promise<void> {
  const results = await axe.run(container, {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    },
    rules: {
      'color-contrast': { enabled: false },
    },
  });

  if (results.violations.length > 0) {
    const summary = results.violations
      .map(v => `- [${v.id}] ${v.help} (${v.nodes.length} node(s)) — ${v.helpUrl}`)
      .join('\n');
    expect.fail(`Accessibility violations found:\n${summary}`);
  }

  expect(results.violations).toHaveLength(0);
}
