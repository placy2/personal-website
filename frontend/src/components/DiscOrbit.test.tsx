import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DiscOrbit from './DiscOrbit';
import { TECHNOLOGIES } from '../constants';
import { expectNoA11yViolations } from '../test/axe';

function getRoot(container: HTMLElement) {
  return container.querySelector('.dgo') as HTMLElement;
}

// jsdom has no AnimationEvent, so React listens for the vendor-prefixed
// webkitAnimationEnd there and fireEvent.animationEnd never reaches the handler.
// Dispatch both names (React subscribes to exactly one) with animationName set.
function endAnimation(el: HTMLElement, animationName: string) {
  act(() => {
    for (const type of ['animationend', 'webkitAnimationEnd']) {
      const event = new Event(type, { bubbles: true });
      Object.defineProperty(event, 'animationName', { value: animationName });
      el.dispatchEvent(event);
    }
  });
}

describe('DiscOrbit', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders one orbiting logo per technology by default', () => {
    const { container } = render(<DiscOrbit />);
    expect(container.querySelectorAll('.dgo-sat img')).toHaveLength(TECHNOLOGIES.length);
  });

  it('hides the decorative scene from assistive tech', () => {
    const { container } = render(<DiscOrbit />);
    expect(container.querySelector('.dgo-stage')).toHaveAttribute('aria-hidden', 'true');
  });

  it('starts a throw on click and ignores clicks until it finishes', () => {
    const { container } = render(<DiscOrbit />);
    const button = screen.getByRole('button', { name: /throw the disc/i });

    fireEvent.click(button);
    expect(getRoot(container)).toHaveClass('is-throwing');
    expect(button).toHaveAttribute('aria-disabled', 'true');

    endAnimation(container.querySelector('.dgo-disc') as HTMLElement, 'dgo-throw');
    expect(getRoot(container)).not.toHaveClass('is-throwing');
    expect(button).toHaveAttribute('aria-disabled', 'false');
  });

  it('counts an ace once the disc reaches the chains', () => {
    vi.useFakeTimers();
    render(<DiscOrbit />);
    fireEvent.click(screen.getByRole('button', { name: /throw the disc/i }));
    expect(screen.getByText(/aces/i)).toHaveTextContent('ACES 0');

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText(/aces/i)).toHaveTextContent('ACES 1');
  });

  it('has no WCAG A/AA violations', async () => {
    const { container } = render(
      <main>
        <DiscOrbit />
      </main>
    );
    await expectNoA11yViolations(container);
  });
});
