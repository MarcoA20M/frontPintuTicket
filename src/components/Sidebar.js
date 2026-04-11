/*eslint-disable*/
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getTicketsByUsuarioId } from '../services/ticketService'; // Usamos el mismo servicio que TrackingUser
import '../components/Styles/sidebar.css';
import logo from '../assets/image.png';

const Sidebar = () => {
  const sidebarBg = "linear-gradient(145deg, #dd1ad3ff 30%, #a50659ff 100%, #5A0F3B 90%)";
  const [tickets, setTickets] = useState([]);
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        // 1. EXTRAER LÓGICA DE ID (Igual que en TrackingUser)
        const usuarioGuardado = localStorage.getItem('usuario');
        if (!usuarioGuardado) return;

        const usuarioObj = JSON.parse(usuarioGuardado);
        
        // Buscamos el ID en todas las posibles llaves
        const userId = usuarioObj.id || usuarioObj.userId || usuarioObj.idUsuario || usuarioObj.id_usuario;
        // Buscamos el nombre
        const userName = usuarioObj.nombre || usuarioObj.userName || usuarioObj.user || 'Usuario';
        
        setNombreUsuario(userName);

        if (userId) {
          // 2. OBTENER TICKETS (Mismo servicio que TrackingUser)
          const data = await getTicketsByUsuarioId(userId);
          
          // Ordenar: más recientes primero y limitar a los últimos 10 para no saturar el sidebar
          const sortedTickets = Array.isArray(data) 
            ? [...data].sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion)).slice(0, 10)
            : [];
            
          setTickets(sortedTickets);
        }
      } catch (error) {
        console.error("Error cargando datos en Sidebar:", error);
      }
    };

    fetchSidebarData();
  }, []); // Solo al montar el componente

  const getDescripcionResumen = (descripcion) => {
    const maxLength = 22;
    if (!descripcion) return "Sin descripción";
    return descripcion.length > maxLength ? descripcion.substring(0, maxLength) + '...' : descripcion;
  };

  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <>
      <button className={`sidebar-hamburger ${open ? 'open' : ''}`} onClick={() => setOpen(!open)}>
        <span></span><span></span><span></span>
      </button>

      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`} style={{ background: sidebarBg }}>
        <div className="sidebar-fixed">
          <div className="sidebar-header">
            <div className="logo"><img src={logo} alt="PintuMex" /></div>
            <div className="user-info-display">
                <small>Sesión de</small>
                <strong>{nombreUsuario}</strong>
            </div>
          </div>

          <nav>
            <ul className="sidebar-nav">
              <li className="sidebar-nav-item">
                <Link to="/" className={`sidebar-nav-link ${location.pathname === "/" ? "active" : ""}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                  <span>Nuevo ticket</span>
                </Link>
              </li>
              <li className="sidebar-nav-item">
                <Link to="/seguimientoUsr" className={`sidebar-nav-link ${location.pathname === "/seguimientoUsr" ? "active" : ""}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3"></circle><path d="M5.5 20a6.5 6.5 0 0 1 13 0"></path></svg>
                  <span>Mi Seguimiento</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="sidebar-history-label">HISTORIAL RECIENTE</div>
        
        <div className="sidebar-scroll">
          <ul className="sidebar-nav">
            {tickets.length > 0 ? (
              tickets.map((t) => (
                <li key={t.folio || t.id} className="sidebar-nav-item">
                  <Link to={`/ticket/${t.folio || t.id}`} className="sidebar-history-link">
                    <small>#{t.folio || t.id}</small>
                    <span>{getDescripcionResumen(t.descripcion)}</span>
                  </Link>
                </li>
              ))
            ) : (
              <li className="empty-history">Sin tickets recientes</li>
            )}
          </ul>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;