import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Projects from '../pages/Projects';
import { PROJECTS } from '../data/projects';

describe('Projects Component', () => {
  it('renders the Projects heading', () => {
    render(<Projects />);
    expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument();
  });

  it('renders a card for every project', () => {
    render(<Projects />);
    for (const project of PROJECTS) {
      expect(screen.getByRole('heading', { name: project.name })).toBeInTheDocument();
    }
  });

  it('links every card to its repository', () => {
    render(<Projects />);
    const repoLinks = screen.getAllByRole('link', { name: 'View Repository' });
    expect(repoLinks).toHaveLength(PROJECTS.length);
    repoLinks.forEach((link, i) => {
      expect(link).toHaveAttribute('href', PROJECTS[i].url);
      expect(link).toHaveAttribute('target', '_blank');
    });
  });
});
