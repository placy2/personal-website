import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import MenuBar from './MenuBar';

const renderMenuBar = () =>
  render(
    <MemoryRouter>
      <MenuBar />
    </MemoryRouter>
  );

describe('MenuBar Component', () => {
  it('starts collapsed', () => {
    renderMenuBar();
    const toggle = screen.getByRole('button', { name: /toggle navigation/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the menu when the toggle button is clicked', async () => {
    const user = userEvent.setup();
    renderMenuBar();
    const toggle = screen.getByRole('button', { name: /toggle navigation/i });

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes the menu when the toggle button is clicked again', async () => {
    const user = userEvent.setup();
    renderMenuBar();
    const toggle = screen.getByRole('button', { name: /toggle navigation/i });

    await user.click(toggle);
    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the menu when a nav link is clicked', async () => {
    const user = userEvent.setup();
    renderMenuBar();
    const toggle = screen.getByRole('button', { name: /toggle navigation/i });

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByRole('link', { name: 'About' }));

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});
