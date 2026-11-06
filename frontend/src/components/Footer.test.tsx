import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Footer from './Footer';

describe('Footer', () => {
  it('renders contact links', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: 'parkerlacy17@gmail.com' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'GitHub' })).toBeInTheDocument();
  });

  it('stamps the build commit, linked to GitHub', () => {
    render(<Footer />);
    const shortSha = __BUILD_SHA__.slice(0, 7);
    const link = screen.getByRole('link', { name: new RegExp(`commit ${shortSha}`) });
    expect(link).toHaveAttribute(
      'href',
      `https://github.com/placy2/personal-website/commit/${__BUILD_SHA__}`
    );
    expect(screen.getByText(__BUILD_DATE__)).toHaveAttribute('datetime', __BUILD_DATE__);
  });
});
