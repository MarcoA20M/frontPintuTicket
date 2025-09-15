// src/contexts/NotificationContext.js
import React, { createContext, useState, useContext } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]); // Notificaciones no leídas
    const [readNotifications, setReadNotifications] = useState([]); // Notificaciones leídas

    // Función para añadir una nueva notificación
    const addNotification = (ticketId, message) => {
        const newNotification = {
            id: Date.now(),
            ticketId: ticketId,
            message: message,
            date: new Date().toLocaleDateString('es-ES'),
        };
        setNotifications(prevNotifications => [newNotification, ...prevNotifications]);
    };

    // Nueva función para mover todas las notificaciones a la lista de "leídas"
    const markAllAsRead = () => {
        setReadNotifications(prevRead => [...prevRead, ...notifications]);
        setNotifications([]); // Limpia la lista de notificaciones no leídas
    };

    return (
        <NotificationContext.Provider value={{ notifications, readNotifications, addNotification, markAllAsRead }}>
            {children}
        </NotificationContext.Provider>
    );
};

// Hook personalizado para facilitar el uso del contexto
export const useNotifications = () => {
    return useContext(NotificationContext);
};