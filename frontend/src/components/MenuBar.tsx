import React from 'react';
import MenuItem from './MenuItem';
import '../stylesheets/MenuBar.css';

const MenuBar: React.FC = () => {
  return (
    <nav>
      <ul>
        <MenuItem to="/" label="Home" />
        <MenuItem to="/about" label="About" />
        <MenuItem to="/projects" label="Projects" />
        <MenuItem to="/resume" label="Resume" />
        <MenuItem to="/gallery" label="Photo Gallery - Coming Soon" />
      </ul>
    </nav>
  );
};

export default MenuBar;