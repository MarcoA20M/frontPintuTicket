/*eslint-disable*/
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../components/Styles/sidebarAdmin.css';
import logo from '../assets/image.png';

const SidebarAdmin = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Cierra el menú automáticamente al navegar
  useEffect(() => { 
    setOpen(false); 
  }, [location.pathname]);

  // Lista con todas tus rutas originales y sus iconos limpios
  const menuItems = [
    {
      path: "/admin/dashboard",
      label: "Dashboard",
      icon: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></>
    },
    {
      path: "/ticketsIngeniero",
      label: "Mis tickets",
      icon: <><circle cx="12" cy="8" r="3"></circle><path d="M5.5 20a6.5 6.5 0 0 1 13 0"></path></>
    },
    {
      path: "/admin/tickets",
      label: "Todos los Tickets",
      icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></>
    },
    {
      path: "/seguimiento",
      label: "Asignar tickets",
      icon: <path d="M0 4.5A1.5 1.5 0 0 1 1.5 3h13A1.5 1.5 0 0 1 16 4.5V6a.5.5 0 0 1-.5.5 1.5 1.5 0 0 0 0 3 .5.5 0 0 1 .5.5v1.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 11.5V10a.5.5 0 0 1 .5-.5 1.5 1.5 0 1 0 0-3A.5.5 0 0 1 0 6zM1.5 4a.5.5 0 0 0-.5.5v1.05a2.5 2.5 0 0 1 0 4.9v1.05a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-1.05a2.5 2.5 0 0 1 0-4.9V4.5a.5.5 0 0 0-.5-.5z" />
    },
    {
      path: "/admin/esta",
      label: "Estadísticas",
      icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></>
    },
    {
      path: "/admin/crear-ticket",
      label: "Crear Ticket",
      icon: <><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></>
    }
  ];

  return (
    <>
      <button
        className={`asb-hamburger${open ? ' asb-open' : ''}`}
        onClick={() => setOpen(!open)}
        aria-label="Menu"
      >
        <span></span><span></span><span></span>
      </button>

      <aside className={`asb-sidebar${open ? ' asb-sidebar-open' : ''}`}>
        <div className="asb-fixed">
          
          <div className="asb-header">
            <div className="asb-logo-container">
              <img src={logo} alt="Logo PintuMex" className="asb-logo-img" />
              <span className="asb-admin-badge">ADMIN</span>
            </div>
          </div>

          <nav className="asb-scroll">
            <ul className="asb-nav-list">
              {menuItems.map((item) => (
                <li key={item.path} className="asb-nav-item">
                  <Link 
                    to={item.path} 
                    className={`asb-nav-link ${location.pathname === item.path ? "asb-active" : ""}`}
                  >
                    <div className="asb-icon-wrapper">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {item.icon}
                      </svg>
                    </div>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

        </div>
      </aside>
    </>
  );
};

export default SidebarAdmin;