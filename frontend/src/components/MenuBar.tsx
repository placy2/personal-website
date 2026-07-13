import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MenuItem from './MenuItem';
import { APP_CONFIG, ROUTES } from '../constants';
import '../stylesheets/MenuBar.css';

const MenuBar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav>
      <Link to={ROUTES.HOME} className="wordmark" onClick={closeMenu}>
        {APP_CONFIG.author}
      </Link>
      <button
        className="menu-toggle"
        onClick={toggleMenu}
        aria-expanded={isMenuOpen}
        aria-label="Toggle navigation"
      >
        ☰
      </button>
      <ul className={isMenuOpen ? 'show' : ''}>
        <MenuItem to={ROUTES.HOME} label="Home" onClick={closeMenu} />
        <MenuItem to={ROUTES.ABOUT} label="About" onClick={closeMenu} />
        <MenuItem to={ROUTES.PROJECTS} label="Projects" onClick={closeMenu} />
        <MenuItem to={ROUTES.RESUME} label="Resume" onClick={closeMenu} />
      </ul>
    </nav>
  );
};

export default MenuBar;
