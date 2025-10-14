// src/contexts/NotificationContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { connect as stompConnect, subscribe as stompSubscribe, disconnect as stompDisconnect, sendMessage } from '../services/stompService';

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
        let subAssigned = null;
        let subUpdated = null;

        const setup = async () => {
            const usuarioGuardado = localStorage.getItem('usuario');
            const usuarioObj = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
            const usuarioId = usuarioObj?.id ?? usuarioObj?.userId ?? usuarioObj?.idUsuario ?? usuarioObj?.id_usuario ?? null;

            try {
                await stompConnect({ url: 'http://localhost:8080/ws' });

                // Suscribirse a la cola del usuario (Spring STOMP suele usar /user/queue/...)
                if (usuarioId) {
                    subAssigned = await stompSubscribe(`/user/${usuarioId}/queue/ticketAssigned`, (payload) => {
                        const folio = payload?.folio ?? payload?.ticketId ?? 'N/A';
                        const ingeniero = payload?.ingeniero || payload?.assignedTo || '';
                        const estatus = payload?.estatus || '';
                        const message = `Tu ticket ${folio} fue actualizado. ${ingeniero ? `Ingeniero: ${ingeniero}. ` : ''}${estatus ? `Estatus: ${estatus}.` : ''}`;
                        addNotification(folio || 'N/A', message);
                    });

                    subUpdated = await stompSubscribe(`/user/${usuarioId}/queue/ticketUpdated`, (payload) => {
                        const folio = payload?.folio ?? payload?.ticketId ?? 'N/A';
                        const message = payload?.message || `Ticket ${folio} ha sido actualizado.`;
                        addNotification(folio, message);
                    });
                } else {
                    console.warn('NotificationProvider: no usuarioId in localStorage; STOMP user subscriptions not created');
                }
            } catch (e) {
                console.error('NotificationProvider: error connecting STOMP', e);
            }
        };

        setup();

        return () => {
            try {
                if (subAssigned) subAssigned.unsubscribe();
                if (subUpdated) subUpdated.unsubscribe();
                stompDisconnect();
            } catch (e) {}
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