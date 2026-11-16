import { render, screen, within } from '@testing-library/react';
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

  it('lists the case studies first, in the intended order', () => {
    renderWork();
    const region = screen.getByRole('region', { name: 'Case studies' });
    const titles = within(region)
      .getAllByRole('heading', { level: 3 })
      .map(heading => heading.textContent);
    expect(titles).toEqual([
      'Build agents that patch themselves every week',
      'Audited access to clusters and databases behind SSO',
      'Hackathon (3rd place prize): AI agents that patrol our Grafana',
    ]);
  });

  it('shows a side projects section after the case studies: write-ups, then this site’s repo', () => {
    renderWork();
    const caseStudies = screen.getByRole('region', { name: 'Case studies' });
    const sideProjects = screen.getByRole('region', { name: 'Side projects' });
    expect(
      caseStudies.compareDocumentPosition(sideProjects) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(
      within(sideProjects).getByRole('heading', { level: 2, name: 'Side projects' })
    ).toBeInTheDocument();

    const links = within(sideProjects).getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAccessibleName(
      'A baby tracker that costs less than the app it replaced'
    );
    expect(links[0]).toHaveAttribute('href', '/work/self-hosted-baby-tracker');
    expect(links[0]).not.toHaveAttribute('target');
    expect(links[1]).toHaveAccessibleName('Personal Site (This!)');
    expect(links[1]).toHaveAttribute('href', 'https://github.com/placy2/personal-website');
    expect(links[1]).toHaveAttribute('target', '_blank');
    expect(links[1]).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('keeps side projects out of the case studies section', () => {
    renderWork();
    const caseStudies = screen.getByRole('region', { name: 'Case studies' });
    for (const study of CASE_STUDIES.filter(entry => entry.kind === 'side')) {
      expect(within(caseStudies).queryByText(study.title)).not.toBeInTheDocument();
    }
  });

  it('does not list the removed coursework or Telegram bot projects', () => {
    renderWork();
    expect(screen.queryByText(/telegram/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/opioid|coursework/i)).not.toBeInTheDocument();
    for (const link of screen.getAllByRole('link')) {
      expect(link.getAttribute('href')).not.toMatch(/telegramBot|US-opioid-data-analysis/);
    }
  });
});
