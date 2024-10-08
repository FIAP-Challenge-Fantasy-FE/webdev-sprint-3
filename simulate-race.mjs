import admin from 'firebase-admin';
import serviceAccount from './service-account.json' assert { type: 'json' };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function startRaceSimulation() {
  const driversSnapshot = await db.collection('drivers').get();
  const drivers = driversSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  const initialRaceStatusDoc = await db.collection('initialRaceStatus').doc('default').get();
  const initialRaceStatus = initialRaceStatusDoc.exists
    ? initialRaceStatusDoc.data()
    : {
        lapsCompleted: 0,
        totalLaps: 45,
        timeElapsed: '00:00:00',
      };

  // Initialize race data in memory
  const raceData = {
    startTime: admin.firestore.FieldValue.serverTimestamp(),
    status: 'in_progress',
    raceStatus: initialRaceStatus,
    drivers: drivers.map((driver) => ({
      name: driver.name,
      position: null,
      lapTime: null,
      speed: null,
      battery: null,
      energy: null,
      performance: {
        averageSpeed: 200,
        consistency: 80,
        racecraft: 80,
      },
      energyManagement: {
        energyUsed: 20,
        regeneration: 5,
        efficiency: 80,
      },
      overtakingData: {
        overtakes: 0,
        defensiveActions: 0,
      },
      bettingTrends: {
        bets: 0,
      },
      betMultipliers: {
        winner: null,
        fastestLap: null,
        podiumFinish: null,
        topFive: null,
        nextLapFastestLap: null,
        nextLapOvertakes: null,
        nextLapEnergyEfficiency: null,
      },
    })),
  };

  // Create a new race document with initial data
  const raceRef = await db.collection('races').add(raceData);

  const interval = setInterval(async () => {
    updateRaceData(raceData);
    await updateFirestore(raceRef, raceData);

    // Validate nextLap bets after each lap
    await validateNextLapBets(raceRef, raceData);

    if (raceData.raceStatus.lapsCompleted >= raceData.raceStatus.totalLaps) {
      clearInterval(interval);
      await completeRace(raceRef, raceData);
      console.log('Race simulation completed');
    }
  }, 5000);
}

function updateRaceData(raceData) {
  const { raceStatus, drivers } = raceData;

  raceStatus.lapsCompleted = Math.min(raceStatus.lapsCompleted + 1, raceStatus.totalLaps);
  raceStatus.timeElapsed = incrementTime(raceStatus.timeElapsed);

  // Update driver positions and stats
  const updatedDrivers = [...drivers].sort(() => Math.random() - 0.5);
  updatedDrivers.forEach((driver, index) => {
    driver.position = index + 1;
    driver.lapTime = `1:${31 + Math.floor(Math.random() * 3)}.${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')}`;
    driver.speed = Math.floor(Math.random() * 50) + 200;
    driver.battery = Math.floor(Math.random() * 20) + 80;
    driver.energy = +(Math.random() * 10 + 20).toFixed(2);

    // Update performance stats
    driver.performance.averageSpeed = Math.max(
      180,
      Math.min(220, driver.performance.averageSpeed + (Math.random() - 0.5) * 2)
    );
    driver.performance.consistency = Math.max(
      70,
      Math.min(100, driver.performance.consistency + (Math.random() - 0.5))
    );
    driver.performance.racecraft = Math.max(
      70,
      Math.min(100, driver.performance.racecraft + (Math.random() - 0.5))
    );

    // Update energy management stats
    driver.energyManagement.energyUsed = Math.min(
      30,
      driver.energyManagement.energyUsed + Math.random() * 0.5
    );
    driver.energyManagement.regeneration = Math.min(
      10,
      driver.energyManagement.regeneration + Math.random() * 0.2
    );
    driver.energyManagement.efficiency = Math.max(
      70,
      Math.min(100, driver.energyManagement.efficiency + (Math.random() - 0.5))
    );

    // Update overtaking data
    driver.overtakingData.overtakes += Math.random() < 0.2 ? 1 : 0;
    driver.overtakingData.defensiveActions += Math.random() < 0.1 ? 1 : 0;
  });

  raceData.drivers = updatedDrivers;

  // Update lap data
  const newLapData = {
    lap: raceStatus.lapsCompleted,
    leader: updatedDrivers[0].name,
    gap: Math.random() * 5,
    drivers: updatedDrivers.map((driver) => ({
      name: driver.name,
      position: driver.position,
      lapTime: driver.lapTime,
      speed: driver.speed,
      battery: driver.battery,
      energy: driver.energy,
    })),
  };
  raceData.latestLapData = newLapData;

  // Calculate and update bet multipliers
  const multipliers = calculateBetMultipliers(updatedDrivers);
  updatedDrivers.forEach((driver) => {
    driver.betMultipliers = multipliers[driver.name];
  });
}

function incrementTime(timeString) {
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  let newSeconds = seconds + 5;
  let newMinutes = minutes;
  let newHours = hours;
  if (newSeconds >= 60) {
    newSeconds -= 60;
    newMinutes += 1;
  }
  if (newMinutes >= 60) {
    newMinutes -= 60;
    newHours += 1;
  }
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}:${newSeconds
    .toString()
    .padStart(2, '0')}`;
}

async function updateFirestore(raceRef, raceData) {
  try {
    await raceRef.set(
      {
        raceStatus: raceData.raceStatus,
        drivers: raceData.drivers,
        latestLapData: raceData.latestLapData,
      },
      { merge: true }
    );
    console.log(`Updated Firestore for lap ${raceData.raceStatus.lapsCompleted}`);
  } catch (error) {
    console.error('Error updating Firestore:', error);
  }
}

function calculateBetMultipliers(drivers) {
  const multipliers = {};
  const totalDrivers = drivers.length || 1;
  drivers.forEach((driver) => {
    const position = driver.position || 1;

    multipliers[driver.name] = {
      winner: calculateMultiplier(10 - (position / totalDrivers) * 5),
      fastestLap: calculateMultiplier(5),
      podiumFinish: calculateMultiplier(7 - (position / totalDrivers) * 3),
      topFive: calculateMultiplier(5 - (position / totalDrivers) * 2),
      nextLapFastestLap: calculateMultiplier(5),
      nextLapOvertakes: calculateMultiplier(4),
      nextLapEnergyEfficiency: calculateMultiplier(3),
    };
  });
  return multipliers;
}

function calculateMultiplier(baseDifficulty) {
  return Math.max(1.1, Math.min(10, baseDifficulty));
}

// New function to validate nextLap bets at the end of each lap
async function validateNextLapBets(raceRef, raceData) {
  const lapNumber = raceData.raceStatus.lapsCompleted;
  const nextLapBetsSnapshot = await raceRef.collection('nextLapBets').where('lap', '==', lapNumber).get();

  if (nextLapBetsSnapshot.empty) {
    return; // No nextLap bets for this lap
  }

  const batch = db.batch();
  nextLapBetsSnapshot.docs.forEach((betDoc) => {
    const bet = betDoc.data();
    let betResult = 'lost';
    let pointsWon = 0;

    const driver = raceData.drivers.find((d) => d.name === bet.driver);

    if (!driver) {
      // Driver not found, bet is lost
      betResult = 'lost';
    } else {
      // Validate the bet based on its type
      switch (bet.type) {
        case 'nextLapFastestLap':
          const fastestLapDriver = raceData.latestLapData.drivers.reduce((prev, curr) =>
            prev.lapTime < curr.lapTime ? prev : curr
          );
          if (fastestLapDriver.name === bet.driver) {
            betResult = 'won';
            pointsWon = Math.floor(bet.amount * bet.multiplier);
          }
          break;
        case 'nextLapOvertakes':
          if (driver.overtakingData.overtakes > 0) {
            betResult = 'won';
            pointsWon = Math.floor(bet.amount * bet.multiplier);
          }
          break;
        case 'nextLapEnergyEfficiency':
          if (driver.energyManagement.efficiency > 90) {
            betResult = 'won';
            pointsWon = Math.floor(bet.amount * bet.multiplier);
          }
          break;
        // Add more cases as needed
        default:
          betResult = 'lost';
      }
    }

    // Update the bet document
    batch.update(betDoc.ref, { status: betResult, points: pointsWon });

    // Update user points
    const userRef = db.collection('users').doc(bet.userId);
    batch.update(userRef, {
      points: admin.firestore.FieldValue.increment(pointsWon),
    });
  });

  // Commit all updates
  await batch.commit();
}

// Updated completeRace function to validate race bets at the end of the race
async function completeRace(raceRef, raceData) {
  const betsSnapshot = await raceRef.collection('userBets').get();
  const winner = raceData.drivers.find((driver) => driver.position === 1).name;

  const batch = db.batch();

  betsSnapshot.docs.forEach((betDoc) => {
    const bet = betDoc.data();
    let betResult = 'lost';
    let pointsWon = 0;

    const driver = raceData.drivers.find((d) => d.name === bet.driver);

    if (!driver) {
      // Driver not found, bet is lost
      betResult = 'lost';
    } else {
      // Validate the bet based on its type
      switch (bet.type) {
        case 'winner':
          if (driver.name === winner) {
            betResult = 'won';
            pointsWon = Math.floor(bet.amount * bet.multiplier);
          }
          break;
        case 'fastestLap':
          const fastestLapDriver = raceData.drivers.reduce((prev, curr) =>
            prev.lapTime < curr.lapTime ? prev : curr
          );
          if (driver.name === fastestLapDriver.name) {
            betResult = 'won';
            pointsWon = Math.floor(bet.amount * bet.multiplier);
          }
          break;
        case 'podiumFinish':
          if (driver.position <= 3) {
            betResult = 'won';
            pointsWon = Math.floor(bet.amount * bet.multiplier);
          }
          break;
        case 'topFive':
          if (driver.position <= 5) {
            betResult = 'won';
            pointsWon = Math.floor(bet.amount * bet.multiplier);
          }
          break;
        // Add more cases as needed
        default:
          betResult = 'lost';
      }
    }

    // Update the bet document
    batch.update(betDoc.ref, { status: betResult, points: pointsWon });

    // Update user points
    const userRef = db.collection('users').doc(bet.userId);
    batch.update(userRef, {
      points: admin.firestore.FieldValue.increment(pointsWon),
    });
  });

  // Update race status to finished and store the winner
  batch.update(raceRef, {
    status: 'finished',
    winner: winner,
  });

  // Commit all updates
  await batch.commit();
}

startRaceSimulation();