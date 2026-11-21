// firebase.js
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

// Inicializa o app de forma segura
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Obtém e exporta a instância do Realtime Database
export const db = getDatabase(app);
