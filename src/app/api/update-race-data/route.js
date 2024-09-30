import { NextResponse } from 'next/server'
import { collection, doc, setDoc, getDoc, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

let raceStatus = {
  lapsCompleted: 0,
  totalLaps: 45,
  timeElapsed: '00:00:00',
}

export async function GET() {
  // Get initial race status
  const raceStatusDoc = await getDoc(doc(db, 'initialRaceStatus', 'default'));
  let raceStatus = raceStatusDoc.exists() ? raceStatusDoc.data() : {
    lapsCompleted: 0,
    totalLaps: 45,
    timeElapsed: '00:00:00',
  };

  // Update race data
  raceStatus.lapsCompleted = Math.min(raceStatus.lapsCompleted + 1, raceStatus.totalLaps)
  raceStatus.timeElapsed = incrementTime(raceStatus.timeElapsed)

  // Update Firestore
  await setDoc(doc(db, 'race', 'status'), raceStatus)

  // Update driver data
  const driversSnapshot = await getDocs(collection(db, 'drivers'));
  const drivers = driversSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const updatedDrivers = [...drivers].sort(() => Math.random() - 0.5)
  await Promise.all(
    updatedDrivers.map((driver, index) => {
      const driverData = {
        position: index + 1,
        lapTime: `1:${31 + Math.floor(Math.random() * 3)}.${Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, '0')}`,
      }
      return setDoc(doc(db, 'drivers', driver.id), { ...driver, ...driverData }, { merge: true })
    })
  )

  return NextResponse.json({ message: 'Race data updated' })
}

function incrementTime(timeString) {
  const [hours, minutes, seconds] = timeString.split(':').map(Number)
  let newSeconds = seconds + 5
  let newMinutes = minutes
  let newHours = hours
  if (newSeconds >= 60) {
    newSeconds -= 60
    newMinutes += 1
  }
  if (newMinutes >= 60) {
    newMinutes -= 60
    newHours += 1
  }
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}:${newSeconds
    .toString()
    .padStart(2, '0')}`
}