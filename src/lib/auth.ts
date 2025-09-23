"use client";

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from './firebase';

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google: ', error);
    throw error;
  }
};

export const signUpWithEmail = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error signing up with email: ', error);
    throw error;
  }
}

export const signInWithEmail = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.error('Error signing in with email: ', error);
        throw error;
    }
}


export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out: ', error);
    throw error;
  }
};
