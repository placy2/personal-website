import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App, { AppRoutes } from './App';
import { ROUTE_META } from './data/routeMeta';

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
    for (const label of ['Home', 'About', 'Work', 'Resume']) {
      expect(within(nav).getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  it('has no Projects item in the nav', () => {
    render(<App />);
    const nav = screen.getByRole('navigation');
    expect(within(nav).queryByRole('link', { name: 'Projects' })).not.toBeInTheDocument();
  });

  // /projects was merged into /work. Render every prerendered route (plus the
  // 404 page) and check that no link on any of them points back at it,
  // relative or absolute, with or without a trailing slash, query or hash.
  const PROJECTS_HREF = /^(https?:\/\/[^/]+)?\/projects(\/|\?|#|$)/i;

  it.each([...ROUTE_META.map(route => route.path), '/does-not-exist'])(
    'has no link to /projects on %s',
    path => {
      render(
        <MemoryRouter initialEntries={[path]}>
          <AppRoutes />
        </MemoryRouter>
      );
      const hrefs = screen.getAllByRole('link').map(link => link.getAttribute('href') ?? '');
      expect(hrefs.length).toBeGreaterThan(0);
      expect(hrefs.filter(href => PROJECTS_HREF.test(href))).toEqual([]);
    }
  );
});
