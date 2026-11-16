import { render, screen, within } from '@testing-library/react';
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
      for (const heading of ['Context', 'Problem', 'What I did', 'Result']) {
        expect(screen.getByRole('heading', { level: 2, name: heading })).toBeInTheDocument();
      }
      // "What I'd change" is optional: shown only when the entry has one.
      expect(screen.queryByRole('heading', { level: 2, name: "What I'd change" }) !== null).toBe(
        Boolean(study.wouldChange)
      );
      expect(screen.getByText(study.result)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /all work/i })).toHaveAttribute('href', '/work');
    });
  }

  for (const study of CASE_STUDIES.filter(entry => entry.figures?.length)) {
    it(`renders the figures of "${study.slug}" after their sections`, () => {
      const { container } = renderAt(`/work/${study.slug}`);
      const figures = container.querySelectorAll('figure');
      expect(figures).toHaveLength(study.figures!.length);
      study.figures!.forEach((figure, i) => {
        const rendered = figures[i];
        expect(within(rendered as HTMLElement).getByText(figure.caption)).toBeInTheDocument();
        for (const image of figure.images) {
          const img = within(rendered as HTMLElement).getByAltText(image.alt);
          expect(img).toHaveAttribute('src', image.src);
          expect(img).toHaveAttribute('width', String(image.width));
          expect(img).toHaveAttribute('height', String(image.height));
        }
        // Directly after the section it belongs to.
        const section = rendered.previousElementSibling;
        expect(section?.tagName).toBe('SECTION');
        const headingFor = {
          context: 'Context',
          problem: 'Problem',
          whatIDid: 'What I did',
          result: 'Result',
          wouldChange: "What I'd change",
        }[figure.after];
        expect(section?.querySelector('h2')?.textContent).toBe(headingFor);
      });
    });
  }

  it('renders no figures for a study without any', () => {
    const plain = CASE_STUDIES.find(entry => !entry.figures);
    if (!plain) return;
    const { container } = renderAt(`/work/${plain.slug}`);
    expect(container.querySelector('figure')).toBeNull();
  });

  it('shows a not-found message for an unknown slug', () => {
    renderAt('/work/does-not-exist');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Case study not found' })
    ).toBeInTheDocument();
  });
});
