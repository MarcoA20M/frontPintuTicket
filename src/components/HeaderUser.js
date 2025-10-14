import React, { useState } from 'react';
import './Styles/header.css';
import logo50 from '../assets/50.png';
import { useNotifications } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { getUsuarioById } from '../services/usuarioService';

const HeaderUser = () => {
    const [showNotifications, setShowNotifications] = useState(false);
    const { notifications } = useNotifications();
    const navigate = useNavigate();

    const handleToggleNotifications = () => {
        setShowNotifications(!showNotifications);
    };

    const handleShowPerfil = async () => {
        try {
            // Obtener el ID real del usuario logueado desde localStorage
            const usuarioGuardado = localStorage.getItem('usuario');
            const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
            const idToFetch = usuario?.id ?? usuario?.idUsuario ?? usuario?.userId ?? 1;
            const data = await getUsuarioById(idToFetch);
            navigate("/perfil", { state: { usuario: data } });
        } catch (error) {
            console.error("Error al cargar usuario:", error);
        }
    };

    const handleOptions = () => {
        navigate('/perfil');
    };

    const handleLogout = () => {
        localStorage.removeItem('usuario');
        try {
            navigate('/');
        } catch (e) {}
        window.location.reload();
    };

    return (
        <header className="header">
            <div style={{ marginRight: 'auto' }}>
                <img
                    src={logo50}
                    alt="50 Años Contigo"
                    className="logo-50-aniversario"
                />
            </div>

            <div className="notifications-container">
                <button
                    onClick={handleToggleNotifications}
                    className="header-link notifications-button"
                    >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="header-icon feather feather-bell"
                    >
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    <span>Notificaciones</span>
                    {notifications.length > 0 && (
                        <span className="notification-badge">
                            {notifications.length}
                        </span>
                    )}
                </button>
                {showNotifications && (
                    <div className="notifications-dropdown">
                        <h3>Cambios en tus Tickets</h3>
                        <ul>
                            {notifications.length > 0 ? (
                                notifications.map((notif) => (
                                    <li key={notif.id} className="notification-item">
                                        <p className="notification-message">
                                            <strong>Ticket {notif.ticketId}:</strong>{' '}
                                            {notif.message}
                                        </p>
                                        <span className="notification-date">
                                            {notif.date}
                                        </span>
                                    </li>
                                ))
                            ) : (
                                <p>No tienes nuevas notificaciones.</p>
                            )}
                        </ul>
                    </div>
                )}
            </div>

            <div className="dropdown">
                <button className="header-link dropdown-toggle" id="profileDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="header-icon feather feather-user"
                    >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span>Perfil</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="profileDropdown">
                    <li><button className="dropdown-item" onClick={handleShowPerfil}>Perfil</button></li>
                    <li><button className="dropdown-item" onClick={handleOptions}>Opciones</button></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li><button className="dropdown-item text-danger" onClick={handleLogout}>Salir</button></li>
                </ul>
            </div>
        </header>
    );
};

export default HeaderUser;
