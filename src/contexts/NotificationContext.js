// src/contexts/NotificationContext.js
import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { connect as stompConnect, subscribe as stompSubscribe, disconnect as stompDisconnect } from '../services/stompService';
import {
    collection,
    doc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
} from 'firebase/firestore';
import { getFirestoreDb } from '../services/firebase';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]); // Notificaciones no leídas
    const [readNotifications, setReadNotifications] = useState([]); // Notificaciones leídas
    const tabIdRef = useRef(Math.random().toString(36).slice(2));
    const bcRef = useRef(null);
    const recentNotifRef = useRef(new Map()); // ticketId -> { origin: 'local'|'server'|'broadcast', ts }
    const IMMEDIATE_DEDUPE_MS = 5000; // evita duplicados inmediatos (cualquier origen)
    const SUPPRESS_SERVER_AFTER_LOCAL_MS = 60000; // si llegó local primero, suprime servidor hasta 60s para el mismo ticket

    // Subscripciones dinámicas por folio a topics específicos (ej: /topic/ticket.123)
    const ticketTopicSubsRef = useRef(new Map()); // folio -> subscription

    const getAuthSnapshot = useCallback(() => {
        try {
            const usuarioGuardado = localStorage.getItem('usuario');
            const usuarioObj = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
            const token = usuarioObj?.accessToken ?? usuarioObj?.token ?? null;
            const userName =
                usuarioObj?.userName ??
                usuarioObj?.username ??
                usuarioObj?.user ??
                usuarioObj?.nombre ??
                'prac1';
            return { token, userName };
        } catch {
            return { token: null, userName: 'prac1' };
        }
    }, []);

    const getUserKeySnapshot = useCallback(() => {
        try {
            const raw = localStorage.getItem('usuario');
            const u = raw ? JSON.parse(raw) : null;
            const key = u?.idUsuario ?? u?.id ?? u?.userId ?? u?.userName ?? u?.username ?? null;
            return key ? String(key) : null;
        } catch {
            return null;
        }
    }, []);

    const getNotificationsCollectionRef = useCallback((db, userKey) => {
        return collection(db, 'users', String(userKey), 'notifications');
    }, []);

    const mapFirestoreNotifToUi = useCallback((docSnap) => {
        const data = docSnap.data() || {};
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : null;
        return {
            id: docSnap.id,
            ticketId: data.ticketId,
            message: data.message,
            origin: data.origin,
            read: Boolean(data.read),
            date:
                typeof data.date === 'string'
                    ? data.date
                    : createdAt
                        ? createdAt.toLocaleDateString('es-ES')
                        : new Date().toLocaleDateString('es-ES'),
            createdAt: createdAt ? createdAt.getTime() : Date.now(),
        };
    }, []);

    const persistNotificationToFirestore = useCallback(async (notification) => {
        const db = getFirestoreDb();
        if (!db) {
            console.warn('[NotificationProvider] Firestore no inicializado; no se persistirá la notificación.');
            return;
        }

        const userKey = getUserKeySnapshot();
        if (!userKey) {
            console.warn('[NotificationProvider] No hay userKey en localStorage.usuario; no se persistirá la notificación.');
            return;
        }

        try {
            const notifRef = doc(db, 'users', String(userKey), 'notifications', String(notification.id));
            await setDoc(
                notifRef,
                {
                    ticketId: notification.ticketId,
                    message: notification.message,
                    origin: notification.origin,
                    read: Boolean(notification.read),
                    date: notification.date,
                    createdAt: serverTimestamp(),
                },
                { merge: true }
            );

            if (process.env.NODE_ENV !== 'production') {
                console.info('[NotificationProvider] Firestore saved:', `users/${String(userKey)}/notifications/${String(notification.id)}`);
            }
        } catch (e) {
            // Esto suele ser "permission-denied" por reglas de Firestore o falta de Auth
            console.error('[NotificationProvider] Firestore persist failed', e);
        }
    }, [getUserKeySnapshot]);

    // Cargar notificaciones persistidas (si Firebase está configurado) al iniciar/cambiar usuario
    useEffect(() => {
        let cancelled = false;
        let intervalId = null;
        let lastUserKey = null;

        const loadFromFirestore = async (forcedUserKey = null) => {
            const db = getFirestoreDb();
            if (!db) {
                // Firebase no configurado: no hacemos nada
                return;
            }

            const userKey = forcedUserKey !== null ? forcedUserKey : getUserKeySnapshot();
            if (!userKey) {
                // Sin usuario: limpiar en memoria
                setNotifications([]);
                setReadNotifications([]);
                return;
            }

            try {
                const colRef = getNotificationsCollectionRef(db, userKey);
                const q = query(colRef, orderBy('createdAt', 'desc'), limit(80));
                const snap = await getDocs(q);
                if (cancelled) return;

                const all = snap.docs.map(mapFirestoreNotifToUi);
                const unread = all.filter(n => !n.read);
                const read = all.filter(n => n.read);
                setNotifications(unread);
                setReadNotifications(read);
            } catch (e) {
                console.error('[NotificationProvider] Firestore load failed', e);
            }
        };

        // Primera carga
        lastUserKey = getUserKeySnapshot();
        loadFromFirestore(lastUserKey);

        // Recargar si cambia usuario en la misma pestaña o desde otra pestaña
        const onStorage = (e) => {
            try {
                if (!e || e.key !== 'usuario') return;
                lastUserKey = getUserKeySnapshot();
                loadFromFirestore(lastUserKey);
            } catch (err) {}
        };
        window.addEventListener('storage', onStorage);

        try {
            intervalId = window.setInterval(() => {
                const current = getUserKeySnapshot();
                if (current !== lastUserKey) {
                    lastUserKey = current;
                    loadFromFirestore(lastUserKey);
                }
            }, 1500);
        } catch (e) {}

        return () => {
            cancelled = true;
            window.removeEventListener('storage', onStorage);
            try { if (intervalId) window.clearInterval(intervalId); } catch (e) {}
        };
    }, [getNotificationsCollectionRef, getUserKeySnapshot, mapFirestoreNotifToUi]);

    const ensureStompConnected = useCallback(async () => {
        const { token, userName } = getAuthSnapshot();
        await stompConnect({
            url: 'http://localhost:8080/ws',
            token,
            connectHeaders: {
                token: token || undefined,
                userName: userName || undefined,
            },
        });
    }, [getAuthSnapshot]);

    const buildUiMessage = useCallback((eventName, payload) => {
        const folio = payload?.folio ?? payload?.ticketId ?? payload?.id ?? 'N/A';
        const prioridad = payload?.prioridad ?? payload?.priority;
        const ingeniero = payload?.ingeniero ?? payload?.engineer;
        const estatus = payload?.estatus ?? payload?.status;

        switch (String(eventName || '').trim()) {
            case 'ticket.assigned':
                return payload?.message || `Ticket ${folio} asignado${ingeniero ? ` a ${ingeniero}` : ''}.`;
            case 'ticket.updated':
                return payload?.message || `Ticket ${folio} actualizado${estatus ? ` (${estatus})` : ''}.`;
            case 'ticket.priorityChanged':
                return payload?.message || `Prioridad de ticket ${folio} cambiada${prioridad ? ` a ${prioridad}` : ''}.`;
            case 'ticket.closed':
                return payload?.message || `Ticket ${folio} cerrado.`;
            case 'ticket.reassigned':
                return payload?.message || `Ticket ${folio} reasignado.`;
            default:
                return payload?.message || `Ticket ${folio}: nueva notificación.`;
        }
    }, []);

    const shouldSkipServer = useCallback((ticketKey) => {
        try {
            const recent = recentNotifRef.current.get(String(ticketKey));
            if (!recent) return false;
            const delta = Date.now() - recent.ts;
            if (delta < IMMEDIATE_DEDUPE_MS) return true; // duplicado inmediato
            // si la última notificación fue local, suprimir servidor por más tiempo
            if (recent.origin === 'local' && delta < SUPPRESS_SERVER_AFTER_LOCAL_MS) return true;
            return false;
        } catch {
            return false;
        }
    }, [IMMEDIATE_DEDUPE_MS, SUPPRESS_SERVER_AFTER_LOCAL_MS]);

    // listeners locales: permitir que componentes se suscriban directamente a notificaciones entrantes
    const listenersRef = useRef(new Set());

    const notifyListeners = useCallback((notification) => {
        try {
            listenersRef.current.forEach(cb => {
                try { cb(notification); } catch (e) { console.debug('Notification listener error', e); }
            });
        } catch (e) {}
    }, []);

    // Función para añadir una nueva notificación
    // Ahora acepta opciones: { skipBroadcast } para evitar que mensajes recibidos por BroadcastChannel/storage se re-propaguen
    const addNotification = useCallback((ticketId, message, options = {}) => {
        const { skipBroadcast = false, origin = 'local', persist = origin !== 'broadcast' } = options;
        console.debug('[NotificationProvider] addNotification called', { ticketId, message, skipBroadcast });
        const notifId = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const newNotification = {
            id: notifId,
            ticketId: ticketId,
            message: message,
            date: new Date().toLocaleDateString('es-ES'),
            origin,
            read: false,
        };
        setNotifications(prevNotifications => [newNotification, ...prevNotifications]);
        // avisar a listeners locales (componentes suscritos)
        try { notifyListeners(newNotification); } catch (e) { /* ignore */ }
        // marcar como notificación local reciente para evitar ser sobrescrita por STOMP inmediato
        try { recentNotifRef.current.set(String(ticketId), { origin, ts: Date.now() }); } catch (e) {}
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

        // Persistir en Firestore (si está configurado)
        if (persist) {
            persistNotificationToFirestore(newNotification);
        }
    }, [notifyListeners, persistNotificationToFirestore]);

    const subscribeTicketTopic = useCallback(async (folio) => {
        const key = String(folio ?? '').trim();
        if (!key) return () => {};

        // Evitar duplicar subscripciones para el mismo folio
        if (ticketTopicSubsRef.current.has(key)) {
            return () => {
                const sub = ticketTopicSubsRef.current.get(key);
                try { sub?.unsubscribe?.(); } catch (e) {}
                ticketTopicSubsRef.current.delete(key);
            };
        }

        await ensureStompConnected();

        const destination = `/topic/ticket.${key}`;
        const sub = await stompSubscribe(destination, (payload) => {
            try {
                console.debug('[NotificationProvider] topic payload', { destination, payload });
                const event = payload?.event || payload?.type || payload?.evento || 'ticket.updated';
                if (!String(event).startsWith('ticket.')) return;
                const folioFromPayload = payload?.folio ?? payload?.ticketId ?? payload?.id ?? key;
                const ticketKey = String(folioFromPayload || key);
                const message = buildUiMessage(event, payload);
                if (shouldSkipServer(ticketKey)) return;
                addNotification(ticketKey, message, { origin: 'server' });
            } catch (e) {
                console.error('Error processing ticket topic payload', e);
            }
        });

        ticketTopicSubsRef.current.set(key, sub);
        return () => {
            try { sub?.unsubscribe?.(); } catch (e) {}
            ticketTopicSubsRef.current.delete(key);
        };
    }, [addNotification, buildUiMessage, ensureStompConnected, shouldSkipServer]);

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
                        addNotification(data.ticketId ?? data.ticketId, data.message ?? data.message, { skipBroadcast: true, origin: 'broadcast' });
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
                        addNotification(data.ticketId ?? data.ticketId, data.message ?? data.message, { skipBroadcast: true, origin: 'broadcast' });
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
    }, [addNotification]);

    // Configurar socket para recibir notificaciones push desde el servidor
    useEffect(() => {
        let subPrivate = null;
        let cancelled = false;
        let lastUsuarioRaw = null;
        let intervalId = null;

        // Capturar ref actual para evitar warning de refs mutables en cleanup
        const ticketTopicSubs = ticketTopicSubsRef.current;

        const cleanupSubs = () => {
            try { if (subPrivate) subPrivate.unsubscribe(); } catch (e) {}
            subPrivate = null;
        };

        const connectAndSubscribe = async () => {
            cleanupSubs();

            try {
                await ensureStompConnected();
                if (cancelled) return;

                // Suscripción privada: el backend debe resolver el Principal por el JWT
                // y enviar con convertAndSendToUser(..., "/queue/notifications", ...)
                subPrivate = await stompSubscribe(`/user/queue/notifications`, (payload) => {
                    console.debug('[NotificationProvider] /user/queue/notifications payload', payload);
                    const eventName = payload?.event || payload?.type || payload?.evento || 'ticket.updated';
                    // Filtrado por UI: solo aceptar eventos de tickets
                    if (!String(eventName).startsWith('ticket.')) {
                        console.debug('[NotificationProvider] ignored non-ticket event', { eventName });
                        return;
                    }

                    const folio = payload?.folio ?? payload?.ticketId ?? payload?.id ?? 'N/A';
                    const ticketKey = String(folio || 'N/A');
                    const message = buildUiMessage(eventName, payload);
                    if (shouldSkipServer(ticketKey)) {
                        console.debug('[NotificationProvider] skipped private notif due to recent', { ticketKey });
                        return;
                    }
                    addNotification(ticketKey, message, { origin: 'server' });
                });
            } catch (e) {
                console.error('NotificationProvider: error connecting STOMP', e);
            }
        };

        // 1) primer intento al montar
        connectAndSubscribe();

        // 2) reconectar al login/logout (cuando cambie localStorage.usuario) - otras pestañas
        const onStorage = (e) => {
            try {
                if (!e || e.key !== 'usuario') return;
                connectAndSubscribe();
            } catch (err) {}
        };
        window.addEventListener('storage', onStorage);

        // 3) reconectar en la MISMA pestaña si cambia el usuario/token
        try {
            lastUsuarioRaw = localStorage.getItem('usuario');
            intervalId = window.setInterval(() => {
                const raw = localStorage.getItem('usuario');
                if (raw !== lastUsuarioRaw) {
                    lastUsuarioRaw = raw;
                    connectAndSubscribe();
                }
            }, 1500);
        } catch (e) {}

        return () => {
            cancelled = true;
            window.removeEventListener('storage', onStorage);
            try { if (intervalId) window.clearInterval(intervalId); } catch (e) {}
            cleanupSubs();
            try {
                // limpiar topics dinámicos
                for (const sub of ticketTopicSubs.values()) {
                    try { sub?.unsubscribe?.(); } catch (e) {}
                }
                ticketTopicSubs.clear();
            } catch (e) {}
            try { stompDisconnect(); } catch (e) {}
        };
    }, [addNotification, buildUiMessage, ensureStompConnected, shouldSkipServer]);

    // Nueva función para mover todas las notificaciones a la lista de "leídas"
    const markAllAsRead = () => {
        setReadNotifications(prevRead => [...prevRead, ...notifications]);
        setNotifications([]); // Limpia la lista de notificaciones no leídas

        // Marcar como leídas en Firestore (si está configurado)
        (async () => {
            const db = getFirestoreDb();
            if (!db) return;
            const userKey = getUserKeySnapshot();
            if (!userKey) return;

            try {
                // Actualizar solo las que tenemos en memoria (evita scans grandes)
                const updates = notifications.map((n) => {
                    const ref = doc(db, 'users', String(userKey), 'notifications', String(n.id));
                    return updateDoc(ref, { read: true });
                });
                await Promise.allSettled(updates);
            } catch (e) {
                console.debug('[NotificationProvider] Firestore markAllAsRead failed', e);
            }
        })();
    };

    return (
        <NotificationContext.Provider value={{ notifications, readNotifications, addNotification, markAllAsRead, subscribeNotifications, subscribeTicketTopic }}>
            {children}
        </NotificationContext.Provider>
    );
};

// Hook personalizado para facilitar el uso del contexto
export const useNotifications = () => {
    return useContext(NotificationContext);
};

//agregar peersistencia de notificaciones leidas para que no desaparezcan al recargar