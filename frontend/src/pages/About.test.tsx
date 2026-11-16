import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import About from '../pages/About';

const getTimeline = () => {
  render(<About />);
  const region = screen.getByRole('region', { name: 'Timeline' });
  return within(region).getByRole('list');
};

describe('About Component', () => {
  it('renders the main heading', () => {
    render(<About />);
    expect(screen.getByRole('heading', { name: /a little bit about me/i })).toBeInTheDocument();
  });

  it('renders each section heading', () => {
    render(<About />);
    for (const section of [/timeline/i, /early years/i, /career/i, /looking forward/i]) {
      expect(screen.getByRole('heading', { name: section })).toBeInTheDocument();
    }
  });

  it('places the timeline before the Career prose', () => {
    render(<About />);
    const timeline = screen.getByRole('heading', { name: 'Timeline' });
    const career = screen.getByRole('heading', { name: 'Career' });
    expect(timeline.compareDocumentPosition(career) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  it('renders the timeline as an ordered list of exactly three entries, oldest first', () => {
    const list = getTimeline();
    expect(list.tagName).toBe('OL');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(3);

    const [trinity, credera, triumph] = items;
    expect(within(trinity).getByText('Trinity University')).toBeInTheDocument();
    expect(
      within(trinity).getByText('B.S. Computer Science, minor in Music (magna cum laude)')
    ).toBeInTheDocument();

    expect(within(credera).getByText('Credera')).toBeInTheDocument();
    expect(credera).toHaveTextContent(
      /Technology Consultant\s*→\s*to\s*Senior Technology Consultant/
    );

    expect(within(triumph).getByText('Triumph')).toBeInTheDocument();
    expect(within(triumph).getByText('Senior DevOps Engineer')).toBeInTheDocument();
    expect(triumph).toHaveTextContent(/present/);
  });

  it('marks up every year with a machine-readable <time> element', () => {
    const list = getTimeline();
    const items = within(list).getAllByRole('listitem');
    const dateTimes = items.map(item =>
      Array.from(item.querySelectorAll('time')).map(time => time.getAttribute('dateTime'))
    );
    expect(dateTimes).toEqual([['2021'], ['2021', '2024'], ['2024']]);
    for (const time of Array.from(list.querySelectorAll('time'))) {
      expect(time).toHaveTextContent(time.getAttribute('dateTime') ?? '');
    }
  });

  it('hides the decorative arrow and dashes from assistive tech and speaks "to" instead', () => {
    const list = getTimeline();
    const [, credera, triumph] = within(list).getAllByRole('listitem');
    const arrow = within(credera).getByText('→');
    expect(arrow).toHaveAttribute('aria-hidden', 'true');
    expect(arrow.nextElementSibling).toHaveClass('visually-hidden');
    expect(arrow.nextElementSibling).toHaveTextContent('to');
    for (const item of [credera, triumph]) {
      const dash = within(item).getByText('–');
      expect(dash).toHaveAttribute('aria-hidden', 'true');
      expect(dash.nextElementSibling).toHaveClass('visually-hidden');
    }
  });
});
