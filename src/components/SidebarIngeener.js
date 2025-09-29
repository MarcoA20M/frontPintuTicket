/* src/components/Sidebar.js */
/*eslint-disable*/
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getTicketsByUsuario } from '../services/ticketService';
import '../components/Styles/sidebar.css';
import logo from '../assets/image.png';

const Sidebar = () => {
    const sidebarBg = "linear-gradient(145deg, #dd1ad3ff 30%, #a50659ff 100%, #5A0F3B 90%)";
    const [tickets, setTickets] = useState([]);
    const usuario = "Pedro"; // Puedes cambiar esto si manejas auth
    const location = useLocation();

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
        return descripcion.length > maxLength ? descripcion.substring(0, maxLength) + '...' : descripcion;
    };

    return (
        <aside className="sidebar" style={{ background: sidebarBg, boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>

            {/* logo de la empresa */}
            <div className="sidebar-fixed">
                <div className="sidebar-header">
                    <div className="logo">
                        <Link to='/ingeniero' className = {`sidebar-nav-link ${location.pathname === "/ingeniero" ? "active" : ""}`} >
                            <img src={logo} alt="Logo PintuMex" />
                            <span></span>
                        </Link>
                    </div>
                </div>                                                                      
                <nav>
                    {/* tabla de seguimiento de tickets */}
                    <ul className="sidebar-nav">
                        <li className="sidebar-nav-item">
                            <Link to="/tabla" className={`sidebar-nav-link ${location.pathname === "/" ? "active" : ""}`}>
                                <span className="sidebar-nav-link-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-clock">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                </span>
                                seguimiento
                            </Link>
                        </li>
                        {/* registros */}
                        <li className="sidebar-nav-item add-new">
                            <Link to="/new-ticket" className={`sidebar-nav-link ${location.pathname === "/new-ticket" ? "active" : ""}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 20h9"></path>
                                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                </svg>
                                <span>Registros</span>
                            </Link>
                        </li>
                        {/* equipo */}
                        <li className="sidebar-nav-item">
                            <Link to="/seguimientoUsr" className={`sidebar-nav-link ${location.pathname === "/seguimiento" ? "active" : ""}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 11l2-2 4 4 8-8 4 4v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4z"></path>
                                </svg>
                                <span>Equipo</span>
                            </Link>
                        </li>
                        {/* <li className="sidebar-nav-item">
                            <Link to="/seguimientoUsr" className={`sidebar-nav-link ${location.pathname === "/seguimientoUsr" ? "active" : ""}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="8" r="3"></circle>
                                    <path d="M5.5 20a6.5 6.5 0 0 1 13 0"></path>
                                </svg>
                                <span>Seguimiento usuario</span>
                            </Link>
                        </li> */}
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
    );
};

export default Sidebar;
