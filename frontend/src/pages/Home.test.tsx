import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Home from '../pages/Home';
import { TECHNOLOGIES } from '../constants';

describe('Home Component', () => {
  it('renders Parker Lacy heading', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { name: /parker lacy/i })).toBeInTheDocument();
  });

  it('displays professional description', () => {
    render(<Home />);
    expect(screen.getByText(/cloud engineer based in the denver area/i)).toBeInTheDocument();
  });

  it('shows an icon for every technology', () => {
    render(<Home />);
    for (const tech of TECHNOLOGIES) {
      expect(screen.getByAltText(tech.name)).toBeInTheDocument();
    }
  });

  it('has links to external resources', () => {
    render(<Home />);
    const kubernetesLink = screen.getByRole('link', { name: /kubernetes/i });
    expect(kubernetesLink).toHaveAttribute('href', 'https://kubernetes.io/');
    expect(kubernetesLink).toHaveAttribute('target', '_blank');
  });
});
