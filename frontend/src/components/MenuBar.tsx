import React from 'react';
import { Link } from 'react-router-dom';
import '../stylesheets/MenuBar.css';

const MenuBar: React.FC = () => {
  return (
    <nav>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/contact">Contact Form - Coming Soon</Link></li>
        <li><Link to="/projects">Projects</Link></li>
        <li><Link to="/resume">Resume</Link></li>
        <li><Link to="/gallery">Photo Gallery - Coming Soon</Link></li>
      </ul>
    </nav>
  );
};

export default MenuBar;