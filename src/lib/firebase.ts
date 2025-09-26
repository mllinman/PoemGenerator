import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "studio-3769717297-cfea7.firebaseapp.com",
  projectId: "studio-3769717297-cfea7",
  storageBucket: "studio-3769717297-cfea7.appspot.com",
  messagingSenderId: "251750681972",
  appId: "1:251750681972:web:e4937b9101dbf0dfdef021"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
