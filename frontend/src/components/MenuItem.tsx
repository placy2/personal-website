import React from 'react';
import { NavLink, NavLinkProps } from 'react-router-dom';

interface MenuItemProps extends NavLinkProps {
  label: string;
}

const MenuItem: React.FC<MenuItemProps> = ({ label, ...navLinkProps }) => {
  return (
    <NavLink {...navLinkProps} className={({ isActive }) => (isActive ? 'active' : '')}>
      <li>{label}</li>
    </NavLink>
  );
};

export default MenuItem;
