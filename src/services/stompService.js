// Servicio sencillo para conectar STOMP sobre SockJS
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

let client = null;
let connected = false;

export const connect = ({ url = 'http://localhost:8080/', onConnect } = {}) => {
    if (client && connected) return Promise.resolve(client);

    return new Promise((resolve, reject) => {
        try {
            client = new Client({
                webSocketFactory: () => new SockJS(url),
                reconnectDelay: 5000,
                debug: function (str) {
                    // console.log('STOMP:', str);
                }
            });

            client.onConnect = (frame) => {
                connected = true;
                if (onConnect) onConnect(frame);
                resolve(client);
            };

            client.onStompError = (frame) => {
                console.error('STOMP error', frame);
            };

            client.activate();
        } catch (e) {
            reject(e);
        }
    });
};

export const subscribe = async (destination, handler) => {
    if (!client) await connect();
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
    if (!client) await connect();
    client.publish({ destination, body: JSON.stringify(payload) });
};

export const disconnect = () => {
    if (client) {
        try {
            client.deactivate();
        } catch (e) {}
        client = null;
        connected = false;
    }
};
