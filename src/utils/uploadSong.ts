import { collection, query, where, getDocs } from 'firebase/firestore';

export async function fetchUserSongs(userId) {
  const q = query(collection(db, 'songs'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
} 