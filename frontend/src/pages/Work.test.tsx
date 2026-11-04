import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import Work from './Work';
import { CASE_STUDIES } from '../data/caseStudies';

const renderWork = () =>
  render(
    <MemoryRouter>
      <Work />
    </MemoryRouter>
  );

describe('Work Component', () => {
  it('renders the Work heading and the case studies section', () => {
    renderWork();
    expect(screen.getByRole('heading', { level: 1, name: 'Work' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Case studies' })).toBeInTheDocument();
  });

  it('links every case study to its own page', () => {
    renderWork();
    for (const study of CASE_STUDIES) {
      expect(screen.getByRole('link', { name: study.title })).toHaveAttribute(
        'href',
        `/work/${study.slug}`
      );
      expect(screen.getByText(study.summary)).toBeInTheDocument();
    }
  });
});
