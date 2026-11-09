import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import headshotPhoto from '../assets/2024headshot.jpeg';
import DiscOrbit from '../components/DiscOrbit';
import { APP_CONFIG, EXTERNAL_LINKS, ROUTES, TECHNOLOGIES } from '../constants';

const Home: React.FC = () => {
  // The plain, linked logo grid is the default (and what gets prerendered for
  // crawlers); the disc-golf orbit is an opt-in easter egg that replaces it.
  const [showDisc, setShowDisc] = useState(false);

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
      {showDisc ? (
        <DiscOrbit />
      ) : (
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
      )}
      <button
        type="button"
        className={`disc-toggle${showDisc ? ' is-active' : ''}`}
        aria-pressed={showDisc}
        aria-label={showDisc ? 'Back to tool list' : 'Fore! Switch to disc golf mode'}
        onClick={() => setShowDisc(v => !v)}
      >
        <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true" focusable="false">
          <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="16" cy="16" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="16" cy="16" r="2" fill="currentColor" />
        </svg>
        <span className="disc-toggle-label" aria-hidden="true">
          {showDisc ? 'Back to tool list' : 'Fore!'}
        </span>
      </button>
    </div>
  );
};

export default Home;
