// firebase.js
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAH_ZWDQcQXTh7WzQm6iMdOze4L1W7eDjc",
  authDomain: "projetoinova-dd646.firebaseapp.com",
  databaseURL: "https://projetoinova-dd646-default-rtdb.firebaseio.com/",
  projectId: "projetoinova-dd646",
  storageBucket: "projetoinova-dd646.firebasestorage.app",
  messagingSenderId: "461610466328",
  appId: "1:461610466328:web:3b9e6d22621287956ad76d",
  measurementId: "G-X5H9STE56Q"
};

// Inicializa o app de forma segura
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Obtém e exporta a instância do Realtime Database
export const db = getDatabase(app);
