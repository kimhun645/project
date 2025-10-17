import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { firebaseConfig, productionFirebaseConfig } from '../lib/firebase-config';

// ใช้ production config สำหรับ production environment
const config = process.env.NODE_ENV === 'production' ? productionFirebaseConfig : firebaseConfig;

const app = initializeApp(config);
export const db = getFirestore(app);
export const auth = getAuth(app);
