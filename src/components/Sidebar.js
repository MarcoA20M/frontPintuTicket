// src/components/Sidebar.js
/*eslint-disable*/
import React, { useState, useEffect } from 'react';
import { getTicketsByUsuario } from '../services/ticketService';
import '../components/Styles/sidebar.css';  // Asegúrate de tener este archivo para los estilos

const Sidebar = ({ onTicketClick, selectedTicket, onViewChange }) => {
  const sidebarBg = "linear-gradient(145deg, #d10cc7ff 30%, #a50659ff 100%, #5A0F3B 90%)";
  const brandIconColor = "#1A1F37";

  const [tickets, setTickets] = useState([]);
  const usuario = "Pedro";

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const fetchedTickets = await getTicketsByUsuario(usuario);
        setTickets(fetchedTickets);
      } catch (error) {
        console.error("Hubo un error al cargar los tickets:", error);
      }
    };
    fetchTickets();
  }, [usuario]);

  const getDescripcionResumen = (descripcion) => {
    const maxLength = 25;
    if (descripcion.length > maxLength) {
      return descripcion.substring(0, maxLength) + '...';
    }
    return descripcion;
  };

  return (
    <aside className="sidebar" style={{ background: sidebarBg, boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
      <div className="sidebar-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div className="logo">
          <span className="logo-icon" style={{ color: brandIconColor, backgroundColor: 'transparent', padding: '5px', borderRadius: '50%' }}>P</span>
          <span>Pintu<span style={{ fontWeight: 400 }}>mex</span></span>
        </div>
        <div className="anniversary">
          50 años CONTIGO
        </div>
      </div>
      <nav>
        <ul className="sidebar-nav">
          {/* Al hacer clic, se llama a onViewChange y se le pasa 'allTickets' */}
          <li className="sidebar-nav-item">
            <a href="#" className="sidebar-nav-link" onClick={() => onViewChange('allTickets')}>
              <span className="sidebar-nav-link-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-clock"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </span>
              Historial de tickets
            </a>
          </li>
          {tickets.map(ticket => {
            const isActive = selectedTicket && selectedTicket.folio === ticket.folio;
            return (
              <li key={ticket.folio} className={`sidebar-nav-item ${isActive ? 'active' : ''}`}>
                {/* Al hacer clic en un ticket, se llama a onTicketClick y se le pasa el ticket */}
                <a href="#" className="sidebar-nav-link" onClick={() => onTicketClick(ticket)}>
                  <span className="sidebar-nav-link-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-file-text"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  </span>
                  {getDescripcionResumen(ticket.descripcion)}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;