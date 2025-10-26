import React from 'react';
import SidebarLink from './SidebarLink';
import { faSun, faStar, faTasks, faUserFriends, faPlus, faSignOutAlt, faVideo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface SidebarProps {
  isAuthenticated: boolean;
  username: string | null;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isAuthenticated, username, onLogout }) => {
  return (
    <header className="top-bar">
      <div className="sidebar-header">
        {/* Aquí podrías poner el logo o el nombre de usuario */}
        <h2>Organizador 1.0</h2>
      </div>
      <nav className="list-nav">
        <ul>
          {isAuthenticated ? (
            <>
              <li className="user-greeting">Hola, {username}</li>
              <li><SidebarLink to="/my-day" icon={faSun} text="Hoy" /></li>
              <li><SidebarLink to="/important" icon={faStar} text="Importante" /></li>
              <li><SidebarLink to="/assigned" icon={faUserFriends} text="Asignadas a mí" /></li>
              <li className="separator"></li>
              <li><SidebarLink to="/tasks" icon={faTasks} text="Tareas por vencer" /></li>
              <li><SidebarLink to="/screen-recorder" icon={faVideo} text="Grabar Pantalla" /></li>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); }}>
                  <FontAwesomeIcon icon={faSignOutAlt} /> Cerrar Sesión
                </a>
              </li>
            </>
          ) : (
            <li><SidebarLink to="/login" icon={faPlus} text="Ingresar" /></li>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Sidebar;