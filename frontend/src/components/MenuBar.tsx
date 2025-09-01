import React, { useState } from 'react';
import MenuItem from './MenuItem';
import '../stylesheets/MenuBar.css';

const MenuBar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav>
      <button className="menu-toggle" onClick={toggleMenu}>
        🍔
      </button>
      <ul className={isMenuOpen ? 'show' : ''}>
        <MenuItem to="/" label="Home" />
        <MenuItem to="/about" label="About" />
        <MenuItem to="/projects" label="Projects" />
        <MenuItem to="/resume" label="Resume" />
      </ul>
    </nav>
  );
};

export default MenuBar;
