import React from 'react';
import headshotPhoto from '../assets/2024headshot.jpeg';
import { APP_CONFIG, EXTERNAL_LINKS, TECHNOLOGIES } from '../constants';

const Home: React.FC = () => {
  return (
    <div className="home-page-container">
      <a href={EXTERNAL_LINKS.GITHUB} target="_blank" rel="noopener noreferrer">
        <img src={headshotPhoto} className="headshot" alt="Recent headshot of Parker (2023)" />
      </a>
      <h1>Parker Lacy</h1>
      <div className="home-page-text">
        {APP_CONFIG.description.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
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
            <img src={tech.icon} alt={tech.name} className="icon" />
            <span>{tech.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default Home;
