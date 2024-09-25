import React from 'react';
import '../stylesheets/MenuBar.css';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "../../components/ui/navigation-menu"
import { NavLink } from 'react-router-dom';

const Link = ({ href, ...props }: { href: string; label: string }) => {
  return (
    <NavigationMenuItem>
      <NavLink to={href}>
        <NavigationMenuLink>
          {props.label}
        </NavigationMenuLink>
      </NavLink>
    </NavigationMenuItem>
  );
}

const MenuBar: React.FC = () => {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <Link href="/" label="Home" />
        <Link href="/about" label="About" />
        <Link href="/projects" label="Projects" />
        <Link href="/resume" label="Resume" />
        <Link href="/gallery" label="Photo Gallery - Coming Soon" />
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default MenuBar;