import { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, onDisconnect, set, serverTimestamp } from "firebase/database";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const auth = getAuth();
const rtdb = getDatabase();
const firestore = getFirestore();

export function useRaceViewers(raceId) {
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    if (!raceId) {
      console.warn('No raceId provided to useRaceViewers hook');
      return;
    }

    const setupPresence = (uid) => {
      const userStatusRTDBRef = ref(rtdb, `/status/${raceId}/${uid}`);

      const isOfflineForRTDB = {
        state: 'offline',
        last_changed: serverTimestamp(),
      };

      const isOnlineForRTDB = {
        state: 'online',
        last_changed: serverTimestamp(),
      };

      const connectedRef = ref(rtdb, '.info/connected');
      
      const unsubscribeConnection = onValue(connectedRef, (snapshot) => {
        if (snapshot.val() === true) {
          console.log('Connected to RTDB');
          
          // When we disconnect, remove this device
          onDisconnect(userStatusRTDBRef)
            .set(isOfflineForRTDB)
            .then(() => {
              // Set the status to online
              set(userStatusRTDBRef, isOnlineForRTDB);
              console.log('Set online status in RTDB');
            })
            .catch((error) => {
              console.error('Error setting online status:', error);
            });
        } else {
          console.log('Disconnected from RTDB');
        }
      });

      return () => {
        unsubscribeConnection();
        set(userStatusRTDBRef, isOfflineForRTDB);
        console.log('Set offline status in RTDB');
      };
    };

    let unsubscribePresence;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribePresence) {
        unsubscribePresence();
      }
      if (user) {
        console.log('User authenticated, setting up presence');
        unsubscribePresence = setupPresence(user.uid);
      } else {
        console.log('User not authenticated');
      }
    });

    const unsubscribeViewerCount = onSnapshot(doc(firestore, `races/${raceId}`), (doc) => {
      const count = doc.data()?.viewerCount || 0;
      setViewerCount(count);
      console.log('Updated viewer count:', count);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeViewerCount();
      if (unsubscribePresence) {
        unsubscribePresence();
      }
    };
  }, [raceId]);

  return viewerCount;
}
