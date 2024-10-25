import { initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onValueWritten } from 'firebase-functions/v2/database';

initializeApp();

const rtdb = getDatabase();
const firestore = getFirestore();

export const updateViewerCount = onValueWritten('/status/{raceId}/{userId}', async (event) => {
  const raceId = event.params.raceId;
  const userId = event.params.userId;
  const raceRef = firestore.doc(`races/${raceId}`);

  console.log(`Function triggered for raceId: ${raceId}, userId: ${userId}`);

  try {
    const newData = event.data.after.val();
    const oldData = event.data.before.val();

    console.log('Old data:', oldData);
    console.log('New data:', newData);

    if (newData && newData.state === 'online' && (!oldData || oldData.state !== 'online')) {
      console.log(`User ${userId} came online for race ${raceId}`);
      await raceRef.update({ viewerCount: FieldValue.increment(1) });
    } else if ((!newData || newData.state !== 'online') && oldData && oldData.state === 'online') {
      console.log(`User ${userId} went offline for race ${raceId}`);
      await raceRef.update({ viewerCount: FieldValue.increment(-1) });
    } else {
      console.log(`No action needed for this state change. Old state: ${oldData?.state}, New state: ${newData?.state}`);
    }

    console.log(`Successfully updated viewer count for race ${raceId}`);
  } catch (error) {
    console.error(`Error updating viewer count for race ${raceId}:`, error);
    throw new Error('Failed to update viewer count');
  }
});
