export interface Project {
  name: string;
  description: string;
  url: string;
}

// Add a new object here to show another project card on the Projects page.
export const PROJECTS: Project[] = [
  {
    name: 'Personal Site (This!)',
    description: 'My own site — React frontend with AWS hosting 🔋 included, built with Terraform.',
    url: 'https://github.com/placy2/personal-website',
  },
  {
    name: 'Big Data/ML Course Final Project',
    description:
      'Analysis of a large opioid distribution dataset from my undergrad coursework (2019).',
    url: 'https://github.com/placy2/US-opioid-data-analysis',
  },
  {
    name: 'Reddit/Telegram Bot',
    description: 'Fun little Telegram bot that scrapes Reddit and shares what it finds.',
    url: 'https://github.com/placy2/telegramBot',
  },
];
