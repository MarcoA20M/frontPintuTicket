// src/contexts/NotificationContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import io from 'socket.io-client';

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

    // Configurar socket para recibir notificaciones push desde el servidor
    useEffect(() => {
        const socket = io('http://localhost:8080');

        // intentar registrar el usuario en el socket para que el backend lo asocie a una room
        const usuarioGuardado = localStorage.getItem('usuario');
        const usuarioObj = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
        const usuarioId = usuarioObj?.id ?? usuarioObj?.userId ?? usuarioObj?.idUsuario ?? usuarioObj?.id_usuario ?? null;
        if (usuarioId) {
            socket.emit('registerUser', { userId: usuarioId });
            console.log('NotificationProvider: registerUser emitted for', usuarioId);
        }

        // volver a registrar en caso de reconexión
        socket.on('connect', () => {
            if (usuarioId) {
                socket.emit('registerUser', { userId: usuarioId });
                console.log('NotificationProvider: re-registerUser emitted after connect for', usuarioId);
            }
        });

        const onAssigned = (payload) => {
            try {
                const folio = payload?.folio ?? payload?.ticketId ?? payload?.ticketId;
                const ingeniero = payload?.ingeniero || payload?.assignedTo || '';
                const estatus = payload?.estatus || '';
                const message = `Tu ticket ${folio} fue actualizado. ${ingeniero ? `Ingeniero: ${ingeniero}. ` : ''}${estatus ? `Estatus: ${estatus}.` : ''}`;
                addNotification(folio || 'N/A', message);
            } catch (e) {
                console.error('Error procesando ticketAssigned:', e);
            }
        };

        const onUpdated = (payload) => {
            try {
                const folio = payload?.folio ?? payload?.ticketId ?? 'N/A';
                const message = payload?.message || `Ticket ${folio} ha sido actualizado.`;
                addNotification(folio, message);
            } catch (e) {
                console.error('Error procesando ticketUpdated:', e);
            }
        };

        socket.on('ticketAssigned', onAssigned);
        socket.on('ticketUpdated', onUpdated);

        return () => {
            socket.off('ticketAssigned', onAssigned);
            socket.off('ticketUpdated', onUpdated);
            socket.disconnect();
        };
    }, []);

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