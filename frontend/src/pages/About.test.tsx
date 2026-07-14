import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import About from '../pages/About';

describe('About Component', () => {
  it('renders the main heading', () => {
    render(<About />);
    expect(screen.getByRole('heading', { name: /a little bit about me/i })).toBeInTheDocument();
  });

  it('renders each section heading', () => {
    render(<About />);
    for (const section of [/early years/i, /career/i, /looking forward/i]) {
      expect(screen.getByRole('heading', { name: section })).toBeInTheDocument();
    }
  });
});
