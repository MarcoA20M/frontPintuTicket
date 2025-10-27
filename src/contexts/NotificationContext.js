// src/contexts/NotificationContext.js
import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { connect as stompConnect, subscribe as stompSubscribe, disconnect as stompDisconnect, sendMessage } from '../services/stompService';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]); // Notificaciones no leídas
    const [readNotifications, setReadNotifications] = useState([]); // Notificaciones leídas
    const tabIdRef = useRef(Math.random().toString(36).slice(2));
    const bcRef = useRef(null);
    const recentNotifRef = useRef(new Map()); // ticketId -> { origin: 'local'|'server', ts }

    // Función para añadir una nueva notificación
    // Ahora acepta opciones: { skipBroadcast } para evitar que mensajes recibidos por BroadcastChannel/storage se re-propaguen
    const addNotification = (ticketId, message, options = {}) => {
        const { skipBroadcast = false } = options;
        console.debug('[NotificationProvider] addNotification called', { ticketId, message, skipBroadcast });
        const newNotification = {
            id: Date.now(),
            ticketId: ticketId,
            message: message,
            date: new Date().toLocaleDateString('es-ES'),
        };
        setNotifications(prevNotifications => [newNotification, ...prevNotifications]);
        // avisar a listeners locales (componentes suscritos)
        try { notifyListeners(newNotification); } catch (e) { /* ignore */ }
        // marcar como notificación local reciente para evitar ser sobrescrita por STOMP inmediato
        try { recentNotifRef.current.set(String(ticketId), { origin: 'local', ts: Date.now() }); } catch (e) {}
        // Propagar a otras pestañas (BroadcastChannel o storage fallback) a menos que se solicite lo contrario
        if (!skipBroadcast) {
            try {
                const payload = { ...newNotification, origin: tabIdRef.current };
                if (bcRef.current) {
                    bcRef.current.postMessage(payload);
                } else if (typeof window !== 'undefined') {
                    // usar localStorage como fallback (esto dispara evento storage en otras pestañas)
                    try {
                        localStorage.setItem('frontpintu_notification', JSON.stringify(payload));
                    } catch (e) { /* ignore storage errors */ }
                }
            } catch (e) { /* ignore */ }
        }
    };

    // listeners locales: permitir que componentes se suscriban directamente a notificaciones entrantes
    const listenersRef = useRef(new Set());

    const notifyListeners = (notification) => {
        try {
            listenersRef.current.forEach(cb => {
                try { cb(notification); } catch (e) { console.debug('Notification listener error', e); }
            });
        } catch (e) {}
    };

    // Exponer suscripción: devuelve función de cleanup
    const subscribeNotifications = (callback) => {
        if (typeof callback !== 'function') return () => {};
        listenersRef.current.add(callback);
        return () => listenersRef.current.delete(callback);
    };

    // Inicializar BroadcastChannel (o fallback a storage) para propagar entre pestañas
    useEffect(() => {
        try {
            if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
                bcRef.current = new BroadcastChannel('frontpintu_notifications');
                bcRef.current.onmessage = (ev) => {
                    try {
                        const data = ev.data;
                        // evitar procesar mensajes originados en esta misma pestaña
                        if (data && data.origin === tabIdRef.current) return;
                        // recibido desde otra pestaña: usar addNotification pero sin volver a propagar
                        addNotification(data.ticketId ?? data.ticketId, data.message ?? data.message, { skipBroadcast: true });
                    } catch (e) { console.debug('BroadcastChannel onmessage error', e); }
                };
            } else if (typeof window !== 'undefined') {
                // fallback: escuchar eventos storage
                const onStorage = (e) => {
                    try {
                        if (e.key !== 'frontpintu_notification') return;
                        const data = JSON.parse(e.newValue || '{}');
                        if (!data || data.origin === tabIdRef.current) return;
                        // recibido desde otra pestaña: usar addNotification pero sin volver a propagar
                        addNotification(data.ticketId ?? data.ticketId, data.message ?? data.message, { skipBroadcast: true });
                    } catch (err) { /* ignore */ }
                };
                window.addEventListener('storage', onStorage);
                return () => window.removeEventListener('storage', onStorage);
            }
        } catch (e) {
            console.debug('NotificationProvider: BroadcastChannel init failed', e);
        }
        // cleanup for BroadcastChannel
        return () => {
            try { if (bcRef.current) { bcRef.current.close(); bcRef.current = null; } } catch (e) {}
        };
    }, []);

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
                        console.debug('[NotificationProvider] /user/queue/notifications payload', payload);
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
                        console.debug('[NotificationProvider] /topic/tickets payload', payload);
                        // --- Matching robusto entre payload y usuario local ---
                        // Extraer folio y variantes de usuario/ID que el backend puede enviar
                        const folio = payload?.folio ?? payload?.ticketId ?? 'N/A';
                        const usuarioEnPayload = payload?.usuario ?? payload?.user ?? payload?.usuario_nombre;
                        const usuarioIdEnPayload = payload?.usuario_id ?? payload?.userId;

                        // Leer usuario local (variantes de claves comunes)
                        const local = JSON.parse(localStorage.getItem('usuario') || '{}');
                        const localName = local?.userName ?? local?.username ?? local?.nombre;
                        const localId = local?.id ?? local?.idUsuario ?? local?.id_usuario;

                        // Mensaje por defecto
                        const ingeniero = payload?.ingeniero || '';
                        const message = payload?.message || `Tu ticket ${folio} fue MODIFICADO ${ingeniero}`;

                        // 1) Si hay ID en payload y en local -> comparar por ID (más fiable)
                        if (localId && usuarioIdEnPayload && String(localId) === String(usuarioIdEnPayload)) {
                            const ticketKey = String(folio || 'N/A');
                            // si hay una notificación local muy reciente para este folio, preferirla
                            const recent = recentNotifRef.current.get(ticketKey);
                            if (recent && recent.origin === 'local' && Date.now() - recent.ts < 5000) {
                                console.debug('[NotificationProvider] skipping server notif because local recent exists', { ticketKey, recent });
                                return;
                            }
                            const notif = { ticketId: ticketKey, message };
                            addNotification(ticketKey, message);
                            notifyListeners(notif);
                            return;
                        }

                        // 2) Si no hay ID, comparar por nombre (case-insensitive)
                        if (!usuarioIdEnPayload && usuarioEnPayload && localName && String(localName).toLowerCase() === String(usuarioEnPayload).toLowerCase()) {
                            const ticketKey = String(folio || 'N/A');
                            const recent = recentNotifRef.current.get(ticketKey);
                            if (recent && recent.origin === 'local' && Date.now() - recent.ts < 5000) {
                                console.debug('[NotificationProvider] skipping server notif because local recent exists', { ticketKey, recent });
                                return;
                            }
                            const notif = { ticketId: ticketKey, message };
                            addNotification(ticketKey, message);
                            notifyListeners(notif);
                            return;
                        }

                        // 3) Fallback global: si el payload trae folio o message y no pudimos mapear, aceptarlo como notificación global
                        if (payload?.folio || payload?.ticketId || payload?.message) {
                            const ticketKey = String(folio || 'N/A');
                            const recent = recentNotifRef.current.get(ticketKey);
                            if (recent && recent.origin === 'local' && Date.now() - recent.ts < 5000) {
                                console.debug('[NotificationProvider] skipping server fallback notif because local recent exists', { ticketKey, recent });
                                return;
                            }
                            const msg = payload?.message || `Ticket ${folio}: actualización disponible.`;
                            const notif = { ticketId: ticketKey, message: msg };
                            addNotification(ticketKey, msg);
                            notifyListeners(notif);
                            return;
                        }
                        // Si no cumple ninguno, no notificar (evita ruido)
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
        <NotificationContext.Provider value={{ notifications, readNotifications, addNotification, markAllAsRead, subscribeNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
};

// Hook personalizado para facilitar el uso del contexto
export const useNotifications = () => {
    return useContext(NotificationContext);
};

//agregar peersistencia de notificaciones leidas para que no desaparezcan al recargar