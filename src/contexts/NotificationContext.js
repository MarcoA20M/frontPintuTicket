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

                // Suscribirse a la cola privada del usuario y al topic público
                // cola privada usada por backend: /user/{userName}/queue/notifications -> cliente subscribe a /user/queue/notifications
                const usuarioName = usuarioObj?.userName ?? usuarioObj?.username ?? usuarioObj?.user ?? usuarioObj?.nombre ?? null;

                if (usuarioName) {
                    subAssigned = await stompSubscribe(`/user/queue/notifications`, (payload) => {
                        // payload enviado por convertAndSendToUser
                        const folio = payload?.folio ?? payload?.ticketId ?? 'N/A';
                        const message = payload?.message || `Ticket ${folio} ha sido actualizado.`;
                        addNotification(folio || 'N/A', message);
                    });
                } else {
                    console.warn('NotificationProvider: no usuarioName in localStorage; private STOMP subscription not created');
                }

                // Suscribirse también al topic público /topic/tickets y filtrar por usuario (si el backend envía usuario en payload)
                const subTopic = await stompSubscribe(`/topic/tickets`, (payload) => {
                    try {
                        // soportar varias formas de identificar al destinatario en el payload
                        const targetUserId = payload?.usuario_id ?? payload?.userId ?? payload?.usuarioId ?? payload?.user_id ?? null;
                        const targetUserName = payload?.usuario ?? payload?.user ?? payload?.usuario_nombre ?? null;
                        const folio = payload?.folio ?? payload?.ticketId ?? 'N/A';
                        const ingeniero = payload?.ingeniero || '';
                        const message = payload?.message || `Tu ticket ${folio} fue asignado al ingeniero ${ingeniero}`;

                        // Priorizar coincidencia por ID (más fiable). Si coincide, añadir notificación.
                        if (usuarioId && targetUserId && String(usuarioId) === String(targetUserId)) {
                            addNotification(folio || 'N/A', message);
                            return;
                        }

                        // Si no hay ID, intentar por nombre de usuario (case-insensitive)
                        if (usuarioName && targetUserName && String(targetUserName).toLowerCase() === String(usuarioName).toLowerCase()) {
                            addNotification(folio || 'N/A', message);
                            return;
                        }
                    } catch (e) {
                        console.error('Error processing public topic payload', e);
                    }
                });
                // guardar subTopic también para limpiar luego
                subUpdated = subTopic;
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