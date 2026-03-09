// src/services/firebase.js
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const hasFirebaseConfig = (cfg) => {
    // mínimo viable para inicializar
    return Boolean(cfg?.apiKey && cfg?.projectId && cfg?.appId);
};

export const getFirebaseApp = () => {
    if (!hasFirebaseConfig(firebaseConfig)) {
        // Solo aviso (sin mostrar valores) para facilitar diagnóstico
        if (typeof window !== 'undefined') {
            const missing = [
                !firebaseConfig.apiKey ? 'REACT_APP_FIREBASE_API_KEY' : null,
                !firebaseConfig.projectId ? 'REACT_APP_FIREBASE_PROJECT_ID' : null,
                !firebaseConfig.appId ? 'REACT_APP_FIREBASE_APP_ID' : null,
            ].filter(Boolean);
            if (missing.length) {
                console.warn('[firebase] Config incompleta; Firestore deshabilitado. Faltan:', missing.join(', '));
            }
        }
        return null;
    }

    const apps = getApps();
    if (apps.length > 0) return apps[0];

    return initializeApp(firebaseConfig);
};

export const getFirestoreDb = () => {
    const app = getFirebaseApp();
    if (!app) return null;
    return getFirestore(app);
};
