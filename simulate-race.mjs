import admin from 'firebase-admin'
import serviceAccount from './service-account.json' assert { type: 'json' };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()

async function startRaceSimulation() {
  const driversSnapshot = await db.collection('drivers').get()
  const drivers = driversSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

  const initialRaceStatusDoc = await db.collection('initialRaceStatus').doc('default').get()
  const initialRaceStatus = initialRaceStatusDoc.exists ? initialRaceStatusDoc.data() : {
    lapsCompleted: 0,
    totalLaps: 45,
    timeElapsed: '00:00:00',
  }

  const raceRef = await db.collection('races').add({
    startTime: admin.firestore.FieldValue.serverTimestamp(),
    status: 'in_progress'
  })

  // Add initial chat messages to the race
  const initialChatMessagesSnapshot = await db.collection('initialChatMessages').get()
  const initialChatMessages = initialChatMessagesSnapshot.docs.map(doc => doc.data())
  
  for (const message of initialChatMessages) {
    await raceRef.collection('chatMessages').add({
      ...message,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    })
  }

  let raceStatus = { ...initialRaceStatus }
  let lapData = []
  let carData = []
  let bettingTrends = drivers.map((driver) => ({ name: driver.name, bets: 0 }))
  let driverPerformance = drivers.map((driver) => ({
    name: driver.name,
    averageSpeed: 200,
    consistency: 80,
    racecraft: 80,
  }))
  let energyManagement = drivers.map((driver) => ({
    name: driver.name,
    energyUsed: 20,
    regeneration: 5,
    efficiency: 80,
  }))
  let overtakingData = drivers.map((driver) => ({
    name: driver.name,
    overtakes: 0,
    defensiveActions: 0,
  }))

  const interval = setInterval(async () => {
    updateRaceData(drivers, raceStatus, lapData, driverPerformance, energyManagement, overtakingData)
    await updateFirestore(raceRef, raceStatus, lapData, bettingTrends, driverPerformance, energyManagement, overtakingData)

    if (raceStatus.lapsCompleted >= raceStatus.totalLaps) {
      clearInterval(interval)
      await completeRace(raceRef)
      console.log('Race simulation completed')
    }
  }, 5000)
}

function updateRaceData(drivers, raceStatus, lapData, driverPerformance, energyManagement, overtakingData) {
  raceStatus.lapsCompleted = Math.min(raceStatus.lapsCompleted + 1, raceStatus.totalLaps)
  raceStatus.timeElapsed = incrementTime(raceStatus.timeElapsed)

  const updatedDrivers = [...drivers].sort(() => Math.random() - 0.5)
  updatedDrivers.forEach((driver, index) => {
    driver.position = index + 1
    driver.lapTime = `1:${31 + Math.floor(Math.random() * 3)}.${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')}`
  })

  const newLapData = {
    lap: raceStatus.lapsCompleted,
    leader: updatedDrivers[0].name,
    gap: Math.random() * 5,
    drivers: updatedDrivers.map((driver) => ({
      name: driver.name,
      position: driver.position,
      lapTime: driver.lapTime,
      speed: Math.floor(Math.random() * 50) + 200,
      battery: Math.floor(Math.random() * 20) + 80,
      energy: +(Math.random() * 10 + 20).toFixed(2),
    })),
  }
  lapData.push(newLapData)

  driverPerformance = driverPerformance.map((perf) => ({
    ...perf,
    averageSpeed: Math.max(180, Math.min(220, perf.averageSpeed + (Math.random() - 0.5) * 2)),
    consistency: Math.max(70, Math.min(100, perf.consistency + (Math.random() - 0.5))),
    racecraft: Math.max(70, Math.min(100, perf.racecraft + (Math.random() - 0.5))),
  }))

  energyManagement = energyManagement.map((energy) => ({
    ...energy,
    energyUsed: Math.min(30, energy.energyUsed + Math.random() * 0.5),
    regeneration: Math.min(10, energy.regeneration + Math.random() * 0.2),
    efficiency: Math.max(70, Math.min(100, energy.efficiency + (Math.random() - 0.5))),
  }))

  overtakingData = overtakingData.map((data) => ({
    ...data,
    overtakes: data.overtakes + (Math.random() < 0.2 ? 1 : 0),
    defensiveActions: data.defensiveActions + (Math.random() < 0.1 ? 1 : 0),
  }))
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

async function updateFirestore(raceRef, raceStatus, lapData, bettingTrends, driverPerformance, energyManagement, overtakingData) {
  try {
    const batch = db.batch()

    batch.update(raceRef, { status: raceStatus })

    const latestLapData = lapData[lapData.length - 1]
    batch.set(raceRef.collection('lapData').doc(`lap_${latestLapData.lap}`), latestLapData)

    // Calculate and update bet multipliers
    const multipliers = calculateBetMultipliers(latestLapData.drivers)
    Object.entries(multipliers).forEach(([driverName, driverMultipliers]) => {
      batch.set(raceRef.collection('betMultipliers').doc(driverName), driverMultipliers)
    })

    bettingTrends.forEach((trend) => {
      batch.set(raceRef.collection('bettingTrends').doc(trend.name), trend)
    })

    driverPerformance.forEach((perf) => {
      batch.set(raceRef.collection('driverPerformance').doc(perf.name), perf)
    })

    energyManagement.forEach((energy) => {
      batch.set(raceRef.collection('energyManagement').doc(energy.name), energy)
    })

    overtakingData.forEach((data) => {
      batch.set(raceRef.collection('overtakingData').doc(data.name), data)
    })

    await batch.commit()

    console.log(`Updated Firestore for lap ${raceStatus.lapsCompleted}`)
  } catch (error) {
    console.error('Error updating Firestore:', error)
  }
}

function calculateBetMultipliers(drivers) {
  const multipliers = {}
  drivers.forEach(driver => {
    const position = driver.position || 1
    const totalDrivers = drivers.length || 1

    multipliers[driver.name] = {
      winner: calculateMultiplier(10 - (position / totalDrivers) * 5),
      fastestLap: calculateMultiplier(5),
      podiumFinish: calculateMultiplier(7 - (position / totalDrivers) * 3),
      topFive: calculateMultiplier(5 - (position / totalDrivers) * 2),
      nextLapFastestLap: calculateMultiplier(5),
      nextLapOvertakes: calculateMultiplier(4),
      nextLapEnergyEfficiency: calculateMultiplier(3),
    }
  })
  return multipliers
}

function calculateMultiplier(baseDifficulty) {
  return Math.max(1.1, Math.min(10, baseDifficulty))
}

async function completeRace(raceRef) {
  const db = admin.firestore()
  const betsSnapshot = await raceRef.collection('userBets').get()
  const raceDoc = await raceRef.get()
  const raceData = raceDoc.data()
  
  const batch = db.batch()

  betsSnapshot.docs.forEach(betDoc => {
    const bet = betDoc.data()
    let betResult = 'lost'
    let pointsWon = 0

    // Determine if the bet was won
    if (bet.type === 'winner' && bet.driver === raceData.winner) {
      betResult = 'won'
      pointsWon = Math.floor(bet.amount * bet.multiplier)
    }
    // Add more conditions for other bet types

    // Update the bet document
    batch.update(betDoc.ref, { status: betResult, points: pointsWon })

    // Update user points
    const userRef = db.collection('users').doc(bet.userId)
    batch.update(userRef, { 
      points: admin.firestore.FieldValue.increment(pointsWon - bet.amount)
    })
  })

  // Update race status to finished
  batch.update(raceRef, { status: 'finished' })

  // Commit all updates
  await batch.commit()
}

startRaceSimulation()