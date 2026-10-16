
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBvG1CP6wmP1ZwA51R7VurWh0d43jjq1ko',
  authDomain: 'appmap-e98a7.firebaseapp.com',
  projectId: 'appmap-e98a7',
  storageBucket: 'appmap-e98a7.firebasestorage.app',
  messagingSenderId: '728670877122',
  appId: '1:728670877122:web:7c4d4a7d5bbb08c2fb925b',
  measurementId: 'G-EW8KNXPJK4',
};

const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const db = getFirestore(app);
