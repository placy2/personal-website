import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import CaseStudy from './CaseStudy';
import { CASE_STUDIES } from '../data/caseStudies';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/work/:slug" element={<CaseStudy />} />
      </Routes>
    </MemoryRouter>
  );

describe('CaseStudy Component', () => {
  for (const study of CASE_STUDIES) {
    it(`renders every section of "${study.slug}"`, () => {
      renderAt(`/work/${study.slug}`);
      expect(screen.getByRole('heading', { level: 1, name: study.title })).toBeInTheDocument();
      for (const heading of ['Context', 'Problem', 'What I did', 'Result', "What I'd change"]) {
        expect(screen.getByRole('heading', { level: 2, name: heading })).toBeInTheDocument();
      }
      expect(screen.getByText(study.result)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /all work/i })).toHaveAttribute('href', '/work');
    });
  }

  it('shows a not-found message for an unknown slug', () => {
    renderAt('/work/does-not-exist');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Case study not found' })
    ).toBeInTheDocument();
  });
});
