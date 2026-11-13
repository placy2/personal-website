import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { AppRoutes } from '../App';

describe('NotFound', () => {
  it('renders for a path with no matching route', () => {
    render(
      <MemoryRouter initialEntries={['/definitely-not-a-real-page']}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { level: 1, name: /page not found/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to the home page/i })).toHaveAttribute(
      'href',
      '/'
    );
    expect(document.title).toBe('Page not found - Parker Lacy');
  });

  it('does not render on a real route', () => {
    render(
      <MemoryRouter initialEntries={['/about']}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.queryByRole('heading', { name: /page not found/i })).not.toBeInTheDocument();
  });
});
