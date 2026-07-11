import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('displays Parker Lacy name', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Parker Lacy' })).toBeInTheDocument();
  });

  it('has navigation links for every page', () => {
    render(<App />);
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
    for (const label of ['Home', 'About', 'Projects', 'Resume']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
  });
});
