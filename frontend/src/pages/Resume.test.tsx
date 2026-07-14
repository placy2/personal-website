import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Resume from '../pages/Resume';

describe('Resume Component', () => {
  it('renders Resume heading', () => {
    render(<Resume />);
    expect(screen.getByRole('heading', { name: /resume/i })).toBeInTheDocument();
  });

  it('has a mailto link to request a copy', () => {
    render(<Resume />);
    const link = screen.getByRole('link', { name: /request a copy/i });
    expect(link).toHaveAttribute('href', expect.stringMatching(/^mailto:/));
  });
});
