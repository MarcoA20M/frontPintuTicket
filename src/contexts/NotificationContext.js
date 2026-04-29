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
import { getTicketsByUsuarioId } from '../services/ticketService';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]); // Notificaciones no leídas
    const [readNotifications, setReadNotifications] = useState([]); // Notificaciones leídas
    const LOCAL_NOTIFICATIONS_PREFIX = 'frontpintu_notifications_v1';
    const tabIdRef = useRef(Math.random().toString(36).slice(2));
    const bcRef = useRef(null);
    const recentNotifRef = useRef(new Map()); // ticketId -> { origin: 'local'|'server'|'broadcast', ts }
    const IMMEDIATE_DEDUPE_MS = 5000; // evita duplicados inmediatos (cualquier origen)
    const SUPPRESS_SERVER_AFTER_LOCAL_MS = 60000; // si llegó local primero, suprime servidor hasta 60s para el mismo ticket
    const SAME_TICKET_DEDUPE_MS = 15000; // colapsa notificaciones del mismo ticket disparadas por la misma acción

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

    const getCurrentUserSnapshot = useCallback(() => {
        try {
            const raw = localStorage.getItem('usuario');
            const user = raw ? JSON.parse(raw) : null;
            const userKey = user?.idUsuario ?? user?.id ?? user?.userId ?? user?.userName ?? user?.username ?? null;
            const role = String(user?.rol ?? user?.role ?? '').trim().toLowerCase();
            const candidateIds = [
                user?.idUsuario,
                user?.id,
                user?.userId,
                user?.username,
                user?.userName,
            ].filter(Boolean).map((value) => String(value));

            return {
                raw: user,
                userKey: userKey ? String(userKey) : null,
                role,
                candidateIds,
            };
        } catch {
            return { raw: null, userKey: null, role: '', candidateIds: [] };
        }
    }, []);

    const normalizeTicketId = useCallback((value) => {
        return value === undefined || value === null ? null : String(value).trim();
    }, []);

    const extractTicketIdFromMessage = useCallback((message) => {
        const text = String(message || '');
        const match = text.match(/ticket\s*#?\s*([a-zA-Z0-9-]+)/i);
        return match?.[1] ? String(match[1]).trim() : null;
    }, []);

    const extractTicketIdFromPayload = useCallback((payload, fallbackTicketId = null) => {
        const direct =
            normalizeTicketId(payload?.folio) ??
            normalizeTicketId(payload?.ticketId) ??
            normalizeTicketId(payload?.ticket_id) ??
            normalizeTicketId(payload?.ticket?.folio) ??
            normalizeTicketId(payload?.ticket?.ticketId) ??
            normalizeTicketId(payload?.data?.folio) ??
            normalizeTicketId(payload?.data?.ticketId);

        if (direct) return direct;

        const fromMessage = extractTicketIdFromMessage(payload?.message);
        if (fromMessage) return fromMessage;

        return normalizeTicketId(fallbackTicketId);
    }, [extractTicketIdFromMessage, normalizeTicketId]);

    const fetchAllowedTicketIdsForCurrentUser = useCallback(async (userKey) => {
        const currentUser = getCurrentUserSnapshot();
        if (!userKey || currentUser.role !== 'usuario') return null;

        try {
            const tickets = await getTicketsByUsuarioId(userKey);
            return new Set(
                (Array.isArray(tickets) ? tickets : [])
                    .map((ticket) => normalizeTicketId(ticket?.folio ?? ticket?.ticketId ?? ticket?.id))
                    .filter(Boolean)
            );
        } catch (e) {
            console.debug('[NotificationProvider] No se pudieron obtener tickets del usuario para filtrar notificaciones', e);
            return null;
        }
    }, [getCurrentUserSnapshot, normalizeTicketId]);

    const filterNotificationsForCurrentUser = useCallback((items, allowedTicketIds) => {
        if (!Array.isArray(items)) return [];
        if (!(allowedTicketIds instanceof Set) || allowedTicketIds.size === 0) return items;

        return items.filter((item) => {
            const ticketId = normalizeTicketId(item?.ticketId ?? item?.folio ?? item?.id);
            return ticketId ? allowedTicketIds.has(ticketId) : false;
        });
    }, [normalizeTicketId]);

    const notificationBelongsToCurrentUser = useCallback((payload) => {
        const currentUser = getCurrentUserSnapshot();
        if (currentUser.role !== 'usuario') return true;

        const payloadUserIds = [
            payload?.usuario_id,
            payload?.usuarioId,
            payload?.userId,
            payload?.idUsuario,
            payload?.id_usuario,
            payload?.username,
            payload?.userName,
        ].filter(Boolean).map((value) => String(value));

        if (payloadUserIds.length === 0) {
            return false;
        }

        return payloadUserIds.some((value) => currentUser.candidateIds.includes(value));
    }, [getCurrentUserSnapshot]);

    const getLocalNotificationsKey = useCallback((userKey) => {
        return `${LOCAL_NOTIFICATIONS_PREFIX}:${String(userKey)}`;
    }, [LOCAL_NOTIFICATIONS_PREFIX]);

    const loadFromLocalStorage = useCallback((userKey) => {
        try {
            const raw = localStorage.getItem(getLocalNotificationsKey(userKey));
            if (!raw) return { unread: [], read: [] };

            const parsed = JSON.parse(raw);
            const unread = Array.isArray(parsed?.unread) ? parsed.unread : [];
            const read = Array.isArray(parsed?.read) ? parsed.read : [];
            return { unread, read };
        } catch (e) {
            console.debug('[NotificationProvider] localStorage load failed', e);
            return { unread: [], read: [] };
        }
    }, [getLocalNotificationsKey]);

    const mergeNotificationLists = useCallback((...lists) => {
        const mergedMap = new Map();

        lists.flat().forEach((notification) => {
            if (!notification) return;

            const ticketId = normalizeTicketId(notification?.ticketId ?? notification?.folio ?? notification?.id) ?? 'N/A';
            const createdAt = Number(notification?.createdAt || 0);
            const stableKey = String(notification?.id ?? `${ticketId}:${notification?.message ?? ''}:${createdAt}`);
            if (!stableKey) return;

            const previous = mergedMap.get(stableKey);
            if (!previous) {
                mergedMap.set(stableKey, {
                    ...notification,
                    ticketId,
                    createdAt,
                });
                return;
            }

            mergedMap.set(stableKey, {
                ...previous,
                ...notification,
                ticketId,
                createdAt: Math.max(Number(previous?.createdAt || 0), createdAt),
                read: Boolean(previous?.read) || Boolean(notification?.read),
            });
        });

        return Array.from(mergedMap.values()).sort((left, right) => Number(right?.createdAt || 0) - Number(left?.createdAt || 0));
    }, [normalizeTicketId]);

    const persistToLocalStorage = useCallback((userKey, unread, read) => {
        try {
            const payload = {
                unread: Array.isArray(unread) ? unread : [],
                read: Array.isArray(read) ? read : [],
                updatedAt: Date.now(),
            };
            localStorage.setItem(getLocalNotificationsKey(userKey), JSON.stringify(payload));
        } catch (e) {
            console.debug('[NotificationProvider] localStorage persist failed', e);
        }
    }, [getLocalNotificationsKey]);

    const getNotificationsCollectionRef = useCallback((db, userKey) => {
        return collection(db, 'users', String(userKey), 'notifications');
    }, []);

    const mapFirestoreNotifToUi = useCallback((docSnap) => {
        const data = docSnap.data() || {};
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : null;
        const ticketId = normalizeTicketId(data.ticketId) ?? extractTicketIdFromMessage(data.message);
        const fallbackNow = new Date();
        const dateSource = createdAt || fallbackNow;
        return {
            id: docSnap.id,
            ticketId,
            message: data.message,
            origin: data.origin,
            read: Boolean(data.read),
            date:
                typeof data.date === 'string'
                    ? data.date
                    : createdAt
                        ? createdAt.toLocaleDateString('es-ES')
                        : new Date().toLocaleDateString('es-ES'),
            time:
                typeof data.time === 'string'
                    ? data.time
                    : dateSource.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            createdAt: createdAt ? createdAt.getTime() : Date.now(),
        };
    }, [extractTicketIdFromMessage, normalizeTicketId]);

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
                    time: notification.time,
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
        let refreshIntervalId = null;
        let lastUserKey = null;

        const loadFromFirestore = async (forcedUserKey = null) => {
            const userKey = forcedUserKey !== null ? forcedUserKey : getUserKeySnapshot();
            if (!userKey) {
                // Sin usuario: limpiar en memoria
                setNotifications([]);
                setReadNotifications([]);
                return;
            }

            const db = getFirestoreDb();
            if (!db) {
                // Firebase no configurado: usar respaldo por usuario en localStorage
                const localData = loadFromLocalStorage(userKey);
                const allowedTicketIds = await fetchAllowedTicketIdsForCurrentUser(userKey);
                if (cancelled) return;
                setNotifications(filterNotificationsForCurrentUser(localData.unread, allowedTicketIds));
                setReadNotifications(filterNotificationsForCurrentUser(localData.read, allowedTicketIds));
                return;
            }

            try {
                const colRef = getNotificationsCollectionRef(db, userKey);
                const q = query(colRef, orderBy('createdAt', 'desc'), limit(80));
                const snap = await getDocs(q);
                if (cancelled) return;

                const firestoreItems = snap.docs.map(mapFirestoreNotifToUi);
                const localData = loadFromLocalStorage(userKey);
                const all = mergeNotificationLists(
                    firestoreItems,
                    localData.unread,
                    localData.read,
                );
                const allowedTicketIds = await fetchAllowedTicketIdsForCurrentUser(userKey);
                const unread = filterNotificationsForCurrentUser(all.filter(n => !n.read), allowedTicketIds);
                const read = filterNotificationsForCurrentUser(all.filter(n => n.read), allowedTicketIds);
                setNotifications(unread);
                setReadNotifications(read);
                persistToLocalStorage(userKey, unread, read);
            } catch (e) {
                console.error('[NotificationProvider] Firestore load failed', e);
                const localData = loadFromLocalStorage(userKey);
                const allowedTicketIds = await fetchAllowedTicketIdsForCurrentUser(userKey);
                if (cancelled) return;
                setNotifications(filterNotificationsForCurrentUser(localData.unread, allowedTicketIds));
                setReadNotifications(filterNotificationsForCurrentUser(localData.read, allowedTicketIds));
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

        const onWindowFocus = () => {
            loadFromFirestore(lastUserKey);
        };

        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                loadFromFirestore(lastUserKey);
            }
        };

        window.addEventListener('focus', onWindowFocus);
        document.addEventListener('visibilitychange', onVisibilityChange);

        try {
            intervalId = window.setInterval(() => {
                const current = getUserKeySnapshot();
                if (current !== lastUserKey) {
                    lastUserKey = current;
                    loadFromFirestore(lastUserKey);
                }
            }, 1500);
        } catch (e) {}

        try {
            refreshIntervalId = window.setInterval(() => {
                if (document.visibilityState === 'visible') {
                    loadFromFirestore(lastUserKey);
                }
            }, 12000);
        } catch (e) {}

        return () => {
            cancelled = true;
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('focus', onWindowFocus);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            try { if (intervalId) window.clearInterval(intervalId); } catch (e) {}
            try { if (refreshIntervalId) window.clearInterval(refreshIntervalId); } catch (e) {}
        };
    }, [filterNotificationsForCurrentUser, fetchAllowedTicketIdsForCurrentUser, getNotificationsCollectionRef, getUserKeySnapshot, loadFromLocalStorage, mapFirestoreNotifToUi, mergeNotificationLists, persistToLocalStorage]);

    // Persistir siempre por usuario para sobrevivir recargas y cierre de sesión
    useEffect(() => {
        const userKey = getUserKeySnapshot();
        if (!userKey) return;
        persistToLocalStorage(userKey, notifications, readNotifications);
    }, [getUserKeySnapshot, notifications, readNotifications, persistToLocalStorage]);

    const ensureStompConnected = useCallback(async () => {
        const { token, userName } = getAuthSnapshot();
        await stompConnect({
            token,
            connectHeaders: {
                token: token || undefined,
                userName: userName || undefined,
            },
        });
    }, [getAuthSnapshot]);

    const buildUiMessage = useCallback((eventName, payload) => {
        const folio = extractTicketIdFromPayload(payload) ?? 'N/A';
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
    }, [extractTicketIdFromPayload]);

    const shouldShowNotificationForCurrentSession = useCallback((eventName, payload, source = 'server') => {
        const currentUser = getCurrentUserSnapshot();
        const normalizedEvent = String(eventName || '').trim();

        if (payload?.notificationAudience) {
            const audience = String(payload.notificationAudience).trim().toLowerCase();
            if (audience && audience !== currentUser.role) {
                return false;
            }
        }

        if (source === 'topic' && currentUser.role === 'usuario' && normalizedEvent === 'ticket.updated') {
            return false;
        }

        return true;
    }, [getCurrentUserSnapshot]);

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
        const normalizedTicketId = normalizeTicketId(ticketId) ?? extractTicketIdFromMessage(message) ?? 'N/A';
        const now = new Date();
        const nowMs = Date.now();
        let newNotification = null;

        setNotifications((prevNotifications) => {
            const hasRecentSameTicket = prevNotifications.some((notification) => {
                const existingTicketId = normalizeTicketId(notification?.ticketId);
                if (!existingTicketId || existingTicketId !== normalizedTicketId) return false;

                const createdAtMs = Number(notification?.createdAt || 0);
                return createdAtMs > 0 && (nowMs - createdAtMs) < SAME_TICKET_DEDUPE_MS;
            });

            if (hasRecentSameTicket) {
                console.debug('[NotificationProvider] dedupe same ticket - skipped', { ticketId: normalizedTicketId, origin });
                return prevNotifications;
            }

            const notifId = `notif_${nowMs}_${Math.random().toString(36).slice(2, 7)}`;
            newNotification = {
                id: notifId,
                ticketId: normalizedTicketId,
                message: message,
                date: now.toLocaleDateString('es-ES'),
                time: now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                createdAt: nowMs,
                origin,
                read: false,
            };

            return [newNotification, ...prevNotifications];
        });

        if (!newNotification) return;

        // avisar a listeners locales (componentes suscritos)
        try { notifyListeners(newNotification); } catch (e) { /* ignore */ }
        // marcar como notificación local reciente para evitar ser sobrescrita por STOMP inmediato
        try {
            if (normalizedTicketId && normalizedTicketId !== 'N/A') {
                recentNotifRef.current.set(String(normalizedTicketId), { origin, ts: Date.now() });
            }
        } catch (e) {}
        // Propagar a otras pestañas (BroadcastChannel o storage fallback) a menos que se solicite lo contrario
        if (!skipBroadcast) {
            try {
                const payload = {
                    ...newNotification,
                    origin: tabIdRef.current,
                    userKey: getUserKeySnapshot(),
                };
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
    }, [SAME_TICKET_DEDUPE_MS, extractTicketIdFromMessage, getUserKeySnapshot, normalizeTicketId, notifyListeners, persistNotificationToFirestore]);

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
                if (!notificationBelongsToCurrentUser(payload)) return;
                const ticketKey = extractTicketIdFromPayload(payload, key);
                if (!ticketKey) {
                    console.debug('[NotificationProvider] topic notif ignorada por faltar folio de ticket', payload);
                    return;
                }
                const message = buildUiMessage(event, payload);
                if (shouldSkipServer(ticketKey)) return;
                if (!shouldShowNotificationForCurrentSession(event, payload, 'topic')) {
                    notifyListeners({
                        id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                        ticketId: ticketKey,
                        message,
                        origin: 'server',
                        read: true,
                    });
                    return;
                }
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
    }, [addNotification, buildUiMessage, ensureStompConnected, extractTicketIdFromPayload, notifyListeners, shouldShowNotificationForCurrentSession, shouldSkipServer]);

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
                        const currentUserKey = getUserKeySnapshot();
                        // evitar procesar mensajes originados en esta misma pestaña
                        if (data && data.origin === tabIdRef.current) return;
                        if (data?.userKey && currentUserKey && data.userKey !== currentUserKey) return;
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
                        const currentUserKey = getUserKeySnapshot();
                        if (!data || data.origin === tabIdRef.current) return;
                        if (data?.userKey && currentUserKey && data.userKey !== currentUserKey) return;
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
    }, [addNotification, getUserKeySnapshot]);

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
                    if (!notificationBelongsToCurrentUser(payload)) {
                        console.debug('[NotificationProvider] ignored notif for another user', payload);
                        return;
                    }

                    const ticketKey = extractTicketIdFromPayload(payload);
                    if (!ticketKey) {
                        console.debug('[NotificationProvider] private notif ignorada por faltar folio de ticket', payload);
                        return;
                    }
                    const message = buildUiMessage(eventName, payload);
                    if (shouldSkipServer(ticketKey)) {
                        console.debug('[NotificationProvider] skipped private notif due to recent', { ticketKey });
                        return;
                    }
                    if (!shouldShowNotificationForCurrentSession(eventName, payload, 'private')) {
                        notifyListeners({
                            id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                            ticketId: ticketKey,
                            message,
                            origin: 'server',
                            read: true,
                        });
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
    }, [addNotification, buildUiMessage, ensureStompConnected, extractTicketIdFromPayload, notifyListeners, shouldShowNotificationForCurrentSession, shouldSkipServer]);

    // Nueva función para mover todas las notificaciones a la lista de "leídas"
    const markAllAsRead = () => {
        setReadNotifications(prevRead => {
            const nextRead = notifications.map((notification) => ({
                ...notification,
                read: true,
            }));
            const merged = [...nextRead, ...prevRead];
            const seenIds = new Set();
            return merged.filter((notification) => {
                const key = String(notification?.id ?? '');
                if (!key || seenIds.has(key)) return false;
                seenIds.add(key);
                return true;
            });
        });
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