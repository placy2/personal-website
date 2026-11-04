import React from 'react';
import { Link } from 'react-router-dom';
import headshotPhoto from '../assets/2024headshot.jpeg';
import { APP_CONFIG, EXTERNAL_LINKS, ROUTES, TECHNOLOGIES } from '../constants';

const Home: React.FC = () => {
  return (
    <div className="home-page-container">
      <a
        href={EXTERNAL_LINKS.GITHUB}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Parker Lacy's GitHub profile (opens in a new tab)"
      >
        <img src={headshotPhoto} className="headshot" alt="Headshot of Parker Lacy" />
      </a>
      <h1>Parker Lacy</h1>
      <p className="home-headline">{APP_CONFIG.headline}</p>
      <div className="home-page-text">
        <p>{APP_CONFIG.intro}</p>
        <p>{APP_CONFIG.personal}</p>
      </div>
      {/* TODO: point the second button at /architecture once that page exists. */}
      <div className="home-actions">
        <Link className="button" to={ROUTES.WORK}>
          See my work
        </Link>
        <a
          className="button button-secondary"
          href={EXTERNAL_LINKS.SITE_REPO}
          target="_blank"
          rel="noopener noreferrer"
        >
          How this site runs
        </a>
      </div>
      <div className="home-page-text">
        <hr className="home-divider" />
        <p>Here are a few of my favorite tools and technologies I use regularly:</p>
      </div>
      <div className="icon-container">
        {TECHNOLOGIES.map(tech => (
          <a
            key={tech.name}
            href={tech.url}
            target="_blank"
            rel="noopener noreferrer"
            className="icon-link"
          >
            <img src={tech.icon} alt="" className="icon" />
            <span>{tech.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default Home;
