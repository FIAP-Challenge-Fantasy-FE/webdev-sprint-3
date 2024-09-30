import { db } from './firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

export async function getDrivers() {
  const snapshot = await getDocs(collection(db, 'drivers'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getInitialRaceStatus() {
  const docRef = doc(db, 'initialRaceStatus', 'default');
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
}

export async function getInitialChatMessages() {
  const snapshot = await getDocs(collection(db, 'initialChatMessages'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getBetOptions() {
  const snapshot = await getDocs(collection(db, 'betOptions'));
  return snapshot.docs.map(doc => doc.data());
}

export async function getNextLapBetOptions() {
  const snapshot = await getDocs(collection(db, 'nextLapBetOptions'));
  return snapshot.docs.map(doc => doc.data());
}