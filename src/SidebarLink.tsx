import React from 'react';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface SidebarLinkProps {
  to: string;
  icon: IconDefinition;
  text: string;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon, text }) => {
  return (
    <NavLink to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
      <FontAwesomeIcon icon={icon} /> {text}
    </NavLink>
  );
};

export default SidebarLink;