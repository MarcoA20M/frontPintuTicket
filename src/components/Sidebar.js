/* src/components/Sidebar.js */
/*eslint-disable*/
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getUsuarioById } from '../services/usuarioService';
import '../components/Styles/sidebar.css';
import logo from '../assets/image.png';


const Sidebar = () => {
  const sidebarBg = "linear-gradient(145deg, #dd1ad3ff 30%, #a50659ff 100%, #5A0F3B 90%)";
  const [tickets, setTickets] = useState([]);
  const [open, setOpen] = useState(false);
  const usuario = "Pedro"; // Puedes cambiar esto si manejas auth
  const location = useLocation();

  useEffect(() => {
    const fetchTickets = async () => {
      try {
          if (!usuarioId) return;
          const usuarioData = await getUsuarioById(usuarioId);
          const fetchedTickets = usuarioData?.tickets || usuarioData?.misTickets || usuarioData?.ticketsUsuario || [];
          setTickets(fetchedTickets);
      } catch (error) {
        console.error("Hubo un error al cargar los tickets:", error);
      }
    };
    fetchTickets();
  }, [usuario]);

  const getDescripcionResumen = (descripcion) => {
    const maxLength = 25;
    return descripcion.length > maxLength ? descripcion.substring(0, maxLength) + '...' : descripcion;
  };

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
        {/* Contenedor fijo: Logo + Historial */}
        <div className="sidebar-fixed">
          <div className="sidebar-header">
            <div className="logo">
              <img src={logo} alt="Logo PintuMex" />
            </div>
          </div>

          <nav>
            <ul className="sidebar-nav">
              <li className="sidebar-nav-item add-new">
                <Link to="/" className={`sidebar-nav-link ${location.pathname === "/" ? "active" : ""}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                  <span>Agregar un nuevo ticket</span>
                </Link>
              </li>
              <li className="sidebar-nav-item">
                <Link to="/seguimientoUsr" className={`sidebar-nav-link ${location.pathname === "/seguimientoUsr" ? "active" : ""}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="3"></circle>
                    <path d="M5.5 20a6.5 6.5 0 0 1 13 0"></path>
                  </svg>
                  <span>Seguimiento usuario</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Contenedor scrollable: Tickets */}
        <div className="sidebar-scroll">
          <ul className="sidebar-nav">
            {tickets.map(ticket => {
              const isActive = location.pathname === `/ticket/${ticket.folio}`;
              return (
                <li key={ticket.folio} className={`sidebar-nav-item ${isActive ? 'active' : ''}`}>
                  <Link to={`/ticket/${ticket.folio}`} className="sidebar-nav-link">
                    <span className="sidebar-nav-link-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-file-text">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                    </span>
                    {getDescripcionResumen(ticket.descripcion)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
