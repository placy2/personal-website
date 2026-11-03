import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import Home from '../pages/Home';
import { APP_CONFIG, EXTERNAL_LINKS, TECHNOLOGIES } from '../constants';

// Home renders router <Link>s, so it needs a router context.
const renderHome = () =>
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );

describe('Home Component', () => {
  it('renders Parker Lacy heading', () => {
    renderHome();
    expect(screen.getByRole('heading', { name: /parker lacy/i })).toBeInTheDocument();
  });

  it('leads with the job title and location', () => {
    renderHome();
    expect(screen.getByText(APP_CONFIG.headline)).toBeInTheDocument();
  });

  it('links to projects and to the site repo', () => {
    renderHome();
    expect(screen.getByRole('link', { name: 'See my projects' })).toHaveAttribute(
      'href',
      '/projects'
    );
    expect(screen.getByRole('link', { name: 'How this site runs' })).toHaveAttribute(
      'href',
      EXTERNAL_LINKS.SITE_REPO
    );
  });

  it('shows a labeled link for every technology', () => {
    renderHome();
    for (const tech of TECHNOLOGIES) {
      expect(screen.getByRole('link', { name: tech.name })).toBeInTheDocument();
    }
  });

  it('has links to external resources', () => {
    renderHome();
    const kubernetesLink = screen.getByRole('link', { name: /kubernetes/i });
    expect(kubernetesLink).toHaveAttribute('href', 'https://kubernetes.io/');
    expect(kubernetesLink).toHaveAttribute('target', '_blank');
  });
});
