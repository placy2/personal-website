import React from 'react';
import { PROJECTS } from '../data/projects';
import '../stylesheets/Projects.css';

const Projects: React.FC = () => {
  return (
    <div>
      <h1>Projects</h1>
      <p>
        This is a collection of my public projects and past work. While not exhaustive, this is what
        I can easily show off (for now)!
      </p>
      <ul className="project-grid">
        {PROJECTS.map(project => (
          <li key={project.name} className="project-card">
            <h3>{project.name}</h3>
            <p>{project.description}</p>
            <a href={project.url} target="_blank" rel="noopener noreferrer">
              View Repository
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Projects;
