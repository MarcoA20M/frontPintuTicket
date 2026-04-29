// Servicio sencillo para conectar STOMP sobre SockJS
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

let client = null;
let connected = false;
let lastAuthHeader = null;

const API_URL = process.env.REACT_APP_API_URL?.replace(/\/+$/, '');

if (!API_URL) {
    throw new Error('Error al conectarse a la API');
}

const STOMP_URL = process.env.REACT_APP_STOMP_URL?.replace(/\/+$/, '') || `${API_URL}/ws`;

function buildConnectHeaders({ token, connectHeaders } = {}) {
    const headers = { ...(connectHeaders && typeof connectHeaders === 'object' ? connectHeaders : {}) };
    const rawToken = typeof token === 'string' ? token.trim() : '';
    const looksLikeJwt = rawToken && rawToken.split('.').length === 3;
    if (looksLikeJwt) {
        // Spring Security + STOMP suele leer esto desde un ChannelInterceptor al recibir el CONNECT frame
        // Nota: esto NO son headers HTTP del WebSocket, son headers STOMP.
        headers.Authorization = headers.Authorization || `Bearer ${rawToken}`;
        // Alternativa usada en algunos backends: header "token" con el JWT crudo
        headers.token = headers.token || rawToken;
    }
    return headers;
}

export const connect = ({ url = STOMP_URL, token, connectHeaders, onConnect } = {}) => {
    const nextHeaders = buildConnectHeaders({ token, connectHeaders });
    const nextAuthHeader = nextHeaders.Authorization || null;

    // Si ya hay conexión pero cambió el token, fuerza reconexión
    if (client && connected && lastAuthHeader === nextAuthHeader) return Promise.resolve(client);
    if (client && (connected || lastAuthHeader !== nextAuthHeader)) {
        try {
            client.deactivate();
        } catch (e) {}
        client = null;
        connected = false;
    }

    return new Promise((resolve, reject) => {
        try {
            let settled = false;
            const settleReject = (error) => {
                if (settled) return;
                settled = true;
                connected = false;
                reject(error);
            };

            client = new Client({
                // Forzar transporte 'websocket' ayuda a evitar preflight/XHR '/info' con CORS durante pruebas
                webSocketFactory: () => new SockJS(url, null, { transports: ['websocket'] }),
                connectHeaders: nextHeaders,
                reconnectDelay: 5000,
                debug: function (str) {
                    // console.log('STOMP:', str);
                }
            });

            client.onConnect = (frame) => {
                settled = true;
                connected = true;
                lastAuthHeader = nextAuthHeader;
                if (onConnect) onConnect(frame);
                resolve(client);
            };

            client.onStompError = (frame) => {
                console.error('STOMP error', frame);
                settleReject(new Error(frame?.headers?.message || 'STOMP broker error'));
            };

            client.onWebSocketError = (event) => {
                console.error('STOMP websocket error', event);
                settleReject(new Error('STOMP websocket error'));
            };

            client.onWebSocketClose = (event) => {
                connected = false;
                if (!settled) {
                    settleReject(new Error(`STOMP websocket closed (${event?.code ?? 'unknown'})`));
                }
            };

            client.activate();
        } catch (e) {
            reject(e);
        }
    });
};

export const subscribe = async (destination, handler) => {
    if (!client || !connected) await connect();
    if (!client || !connected) {
        throw new Error('No hay conexion STOMP activa');
    }
    return client.subscribe(destination, (message) => {
        let body = null;
        try {
            body = JSON.parse(message.body);
        } catch (e) {
            body = message.body;
        }
        handler(body);
    });
};

export const sendMessage = async (destination, payload) => {
    if (!client || !connected) await connect();
    client.publish({ destination, body: JSON.stringify(payload) });
};

export const disconnect = () => {
    if (client) {
        try {
            client.deactivate();
        } catch (e) {}
        client = null;
        connected = false;
        lastAuthHeader = null;
    }
};
