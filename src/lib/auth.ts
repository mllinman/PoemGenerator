"use client";

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth, storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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

export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error signing up with email: ', error);
    throw error;
  }
}

export const signInWithEmail = async (email: string, password: string) => {
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


export const updateUserProfile = async (displayName: string, photoFile?: File) => {
  const user = auth.currentUser;
  if (!user) throw new Error("No user is signed in.");

  let photoURL = user.photoURL;
  if (photoFile) {
    const storageRef = ref(storage, `profile-pictures/${user.uid}`);
    await uploadBytes(storageRef, photoFile);
    photoURL = await getDownloadURL(storageRef);
  }

  await updateProfile(user, { displayName, photoURL });
  
  // Return the new URL to update the UI instantly
  return { displayName, photoURL };
};
