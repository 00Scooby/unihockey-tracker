import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBqiaJK3HVYPP_VlLCKM1rOSkGdFuMoqL4",
    authDomain: "unihockey-tracker.firebaseapp.com",
    projectId: "unihockey-tracker",
    storageBucket: "unihockey-tracker.firebasestorage.app",
    messagingSenderId: "908581863825",
    appId: "1:908581863825:web:f6fdf6c8037d7700261a30"
};

const app = initializeApp(firebaseConfig);

// Aktiviert die lokale Speicherung für den Offline-Einsatz in der Turnhalle
const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
    })
});

export { db };