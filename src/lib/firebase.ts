import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "studio-3769717297-cfea7",
  appId: "1:251750681972:web:e4937b9101dbf0dfdef021",
  apiKey: "AIzaSyCVUtAywMjPtvBuRBwkds3-iGv8lr1yU74",
  authDomain: "studio-3769717297-cfea7.firebaseapp.com",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
