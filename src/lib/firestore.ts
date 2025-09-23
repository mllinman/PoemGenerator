import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db, auth } from './firebase';

export type Poem = {
  id?: string;
  userId: string;
  title: string;
  poem: string;
  imageDataUri: string;
  createdAt: string;
};

const poemsCollection = collection(db, 'poems');

export const savePoemToFirestore = async (poemData: Omit<Poem, 'id' | 'userId'>) => {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be logged in to save poems.');

  const docRef = await addDoc(poemsCollection, {
    ...poemData,
    userId: user.uid,
  });
  return docRef.id;
};

export const getSavedPoemsFromFirestore = async () => {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(
    poemsCollection,
    where('userId', '==', user.uid),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Poem)
  );
};

export const deletePoemFromFirestore = async (poemId: string) => {
  const docRef = doc(db, 'poems', poemId);
  await deleteDoc(docRef);
};

export const updatePoemTitleInFirestore = async (poemId: string, title: string) => {
  const docRef = doc(db, 'poems', poemId);
  await updateDoc(docRef, { title });
};
