import React, { useState, useEffect } from 'react';
import './Styles/header.css';
import logo50 from '../assets/50.png';
import { useNotifications } from '../contexts/NotificationContext'; // Importar el hook

const Header = () => {
    const [showNotifications, setShowNotifications] = useState(false);
    // Usar el estado global de notificaciones
    const { notifications } = useNotifications();

    const handleToggleNotifications = () => {
        setShowNotifications(!showNotifications);
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
                <button onClick={handleToggleNotifications} className="header-link notifications-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="header-icon feather feather-bell">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    <span>Notificaciones</span>
                    {/* Indicador de notificaciones nuevas */}
                    {notifications.length > 0 && (
                        <span className="notification-badge">{notifications.length}</span>
                    )}
                </button>
                {showNotifications && (
                    <div className="notifications-dropdown">
                        <h3>Cambios en tus Tickets</h3>
                        <ul>
                            {notifications.length > 0 ? (
                                notifications.map(notif => (
                                    <li key={notif.id} className="notification-item">
                                        <p className="notification-message"><strong>Ticket {notif.ticketId}:</strong> {notif.message}</p>
                                        <span className="notification-date">{notif.date}</span>
                                    </li>
                                ))
                            ) : (
                                <p>No tienes nuevas notificaciones.</p>
                            )}
                        </ul>
                    </div>
                )}
            </div>

            <a href="#" className="header-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="header-icon feather feather-user">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>Perfil</span>
            </a>
        </header>
    );
};

export default Header;