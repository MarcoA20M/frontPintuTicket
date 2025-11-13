/* src/components/SidebarAdmin.js */
/*eslint-disable*/
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../components/Styles/sidebar.css';
import logo from '../assets/image.png';

const SidebarAdmin = () => {
  // Color de fondo del sidebar del admin (ligeramente distinto al usuario)
  const sidebarBg = "linear-gradient(145deg, #dd1ad3ff 30%, #a50659ff 100%, #5A0F3B 90%)";
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Cierra el menú al navegar
  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <>
      {/* Botón hamburguesa visible solo en móvil */}
      <button
        className={`sidebar-hamburger${open ? ' open' : ''}`}
        aria-label="Abrir menú"
        onClick={() => setOpen(!open)}
      >
        <span></span><span></span><span></span>
      </button>

      <aside
        className={`sidebar${open ? ' sidebar-open' : ''}`}
        style={{ background: sidebarBg, boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
      >
        {/* Contenedor fijo: Logo + navegación principal */}
        <div className="sidebar-fixed">
          <div className="sidebar-header">
            <div className="logo">
              <img src={logo} alt="Logo PintuMex" />
              <span>Admin</span>
            </div>
          </div>

          <nav>
            <ul className="sidebar-nav">
              <li className="sidebar-nav-item add-new">
                <Link
                  to="/admin/dashboard"
                  className={`sidebar-nav-link ${location.pathname === "/admin/dashboard" ? "active" : ""}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                  <span>Dashboard</span>
                </Link>
              </li>

              <li className="sidebar-nav-item">
                <Link
                  to="/admin/tickets"
                  className={`sidebar-nav-link ${location.pathname === "/admin/tickets" ? "active" : ""}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                  </svg>
                  <span>Todos los Tickets</span>
                </Link>
              </li>

              <li className="sidebar-nav-item">
                <Link
                  to="/admin/esta"
                  className={`sidebar-nav-link ${location.pathname === "/admin/esta" ? "active" : ""}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <span> Estadisticas</span>
                </Link>
              </li>

              <li className="sidebar-nav-item">
                <Link
                  to="/admin/crear-ticket"
                  className={`sidebar-nav-link ${location.pathname === "/admin/crear-ticket" ? "active" : ""}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>Crear Ticket</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Contenedor scrollable: Configuración o más opciones */}
        <div className="sidebar-scroll">
          <ul className="sidebar-nav">
            <li className="sidebar-nav-item">
              <Link
                to="/admin/configuracion"
                className={`sidebar-nav-link ${location.pathname === "/admin/configuracion" ? "active" : ""}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                <span>Configuración</span>
              </Link>
            </li>
          </ul>
        </div>
      </aside>
    </>
  );
};

export default SidebarAdmin;
