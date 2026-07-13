import React from 'react';
import { NavLink, NavLinkProps } from 'react-router-dom';

interface MenuItemProps extends NavLinkProps {
  label: string;
}

const MenuItem: React.FC<MenuItemProps> = ({ label, ...navLinkProps }) => {
  return (
    <li>
      <NavLink {...navLinkProps} className={({ isActive }) => (isActive ? 'active' : '')}>
        {label}
      </NavLink>
    </li>
  );
};

export default MenuItem;
