// Inicialização compartilhada do Firebase pro admin.
// Importado pelos módulos via import.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js';
import { getFunctions } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-functions.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBTx_mrEx6_k9jbN8MeOYztJbsOc6zryl0',
  authDomain: 'cnbmobile-2053c.firebaseapp.com',
  projectId: 'cnbmobile-2053c',
  storageBucket: 'cnbmobile-2053c.firebasestorage.app',
  messagingSenderId: '144617374104',
  appId: '1:144617374104:web:cb38f3303f12616f37abed',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');

export const ADMIN_EMAIL = 'contato@rafaelmariano.com.br';
export const ADMIN_UID = 'X619NYBpp5OqXKTBomuFTISuQGY2';
