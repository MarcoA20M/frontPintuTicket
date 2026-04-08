import React, { useEffect, useRef, useState } from 'react';
import './Styles/header.css';
import logo50 from '../assets/50.png';
import { useNotifications } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { getUsuarioById } from '../services/usuarioService';


const Header = () => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [isBlinking, setIsBlinking] = useState(false);
    const { notifications = [] } = useNotifications();
    const navigate = useNavigate();

    const prevNotificationCountRef = useRef(notifications.length);

    useEffect(() => {
        const prevCount = prevNotificationCountRef.current;
        const currentCount = notifications.length;

        // Actualiza el contador para el siguiente render
        prevNotificationCountRef.current = currentCount;

        // Parpadea solo cuando llega (aumenta) el número de notificaciones.
        // Se mantiene hasta que el usuario abra el panel.
        if (currentCount > prevCount && !showNotifications) {
            setIsBlinking(true);
        }

        // Si ya no hay notificaciones, aseguramos que no parpadee
        if (currentCount === 0) {
            setIsBlinking(false);
        }
    }, [notifications.length, showNotifications]);

    const handleToggleNotifications = () => {
        setShowNotifications((prev) => {
            const next = !prev;
            // Si el usuario abre el panel, detenemos el parpadeo
            if (next) {
                setIsBlinking(false);
            }
            return next;
        });
    };

    const handleShowPerfil = async () => {
        try {
            // 🚨 Aquí debes poner el ID real del usuario logueado (ej: desde contexto o storage)
            const data = await getUsuarioById(1);
            // Mandamos los datos del usuario a la nueva pantalla
            navigate("/perfil", { state: { usuario: data } });
        } catch (error) {
            console.error("Error al cargar usuario:", error);
        }
    };

    const handleOptions = () => {
        // Placeholder: navegar a perfil u otra ruta de opciones
        navigate('/perfil');
    };

    const handleLogout = () => {
        // Limpiar sesión local y recargar para volver a la pantalla de login
        localStorage.removeItem('usuario');
        // opcional: limpiar otras llaves relacionadas con sesión
        try {
            // navegar a raíz y forzar recarga
            navigate('/');
        } catch (e) {
            // no bloquear
        }
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
                    className={`header-link notifications-button ${isBlinking ? 'notifications-button--blink' : ''}`}
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
                    
                    {notifications.length > 0 && (
                        <span className={`notification-badge ${isBlinking ? 'notification-badge--blink' : ''}`}>
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
                                            <strong>Ticket {notif.ticketId}:</strong>{" "}
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

export default Header;
