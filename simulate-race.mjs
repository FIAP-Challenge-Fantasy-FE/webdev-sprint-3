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

  // Update driver stats based on performance
  drivers.forEach((driver) => {
    // Calculate lap time based on average speed and consistency
    const baseLapTime = 90; // Base lap time in seconds
    const speedFactor = (220 - driver.performance.averageSpeed) / 20;
    const consistencyFactor = (100 - driver.performance.consistency) / 100;
    const randomVariation = (Math.random() - 0.5) * 0.5; // Small random variation
    const lapTimeSeconds =
      baseLapTime + speedFactor * 2 + consistencyFactor * 2 + randomVariation;

    driver.lapTime = secondsToLapTime(lapTimeSeconds);

    // Update speed with a small variation
    driver.speed =
      driver.performance.averageSpeed + (Math.random() - 0.5) * 0.5;

    // Update battery and energy management
    driver.battery = Math.max(
      0,
      driver.battery -
        driver.energyManagement.energyUsed +
        driver.energyManagement.regeneration
    );
    driver.energy = Math.max(
      0,
      driver.energy - driver.energyManagement.energyUsed
    );

    // Update overtaking and defensive actions based on racecraft
    driver.overtakingData.overtakes +=
      Math.random() < driver.performance.racecraft / 200 ? 1 : 0;

    // Ensure defensive actions do not decrease
    const previousDefensiveActions = driver.overtakingData.defensiveActions;
    const additionalDefensive =
      Math.random() < driver.performance.racecraft / 200 ? 1 : 0;
    driver.overtakingData.defensiveActions =
      previousDefensiveActions + additionalDefensive;

    // Update performance stats slightly
    driver.performance.averageSpeed += (Math.random() - 0.5) * 0.2;
    driver.performance.consistency += (Math.random() - 0.5) * 0.2;
    driver.performance.racecraft += (Math.random() - 0.5) * 0.2;

    // Clamp performance stats
    driver.performance.averageSpeed = Math.max(
      180,
      Math.min(220, driver.performance.averageSpeed)
    );
    driver.performance.consistency = Math.max(
      70,
      Math.min(100, driver.performance.consistency)
    );
    driver.performance.racecraft = Math.max(
      70,
      Math.min(100, driver.performance.racecraft)
    );
  });

  // Sort drivers based on lap times to determine positions
  drivers.sort((a, b) => {
    const aLapTime = lapTimeToSeconds(a.lapTime);
    const bLapTime = lapTimeToSeconds(b.lapTime);
    return aLapTime - bLapTime;
  });

  // Update positions based on sorted lap times
  drivers.forEach((driver, index) => {
    driver.position = index + 1;
  });

  // Update latest lap data
  raceData.latestLapData = {
    lap: raceStatus.lapsCompleted,
    leader: drivers[0].name,
    gap:
      lapTimeDifference(
        drivers[0].lapTime,
        drivers[1]?.lapTime || drivers[0].lapTime
      ) + 's',
    drivers: drivers.map((driver) => ({
      name: driver.name,
      position: driver.position,
      lapTime: driver.lapTime,
      speed: driver.speed.toFixed(2),
      battery: driver.battery.toFixed(2),
      energy: driver.energy.toFixed(2),
    })),
  };

  // Update the total timeElapsed based on the leader's lap time
  const leaderLapTimeSeconds = lapTimeToSeconds(drivers[0].lapTime);
  const previousTimeElapsedSeconds = raceStatus.timeElapsed
    ? timeStringToSeconds(raceStatus.timeElapsed)
    : 0;
  const newTimeElapsedSeconds = previousTimeElapsedSeconds + leaderLapTimeSeconds;
  raceStatus.timeElapsed = secondsToTimeString(newTimeElapsedSeconds);

  // Calculate and update bet multipliers
  const multipliers = calculateBetMultipliers(drivers);
  drivers.forEach((driver) => {
    driver.betMultipliers = multipliers[driver.name];
  });
}

// Helper function to convert lap time string to seconds
function lapTimeToSeconds(lapTime) {
  const [minutes, seconds] = lapTime.split(':');
  return parseInt(minutes) * 60 + parseFloat(seconds);
}

// Helper function to convert seconds to lap time string
function secondsToLapTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(3).padStart(6, '0');
  return `${minutes}:${seconds}`;
}

// Helper function to calculate time difference between two lap times
function lapTimeDifference(lapTime1, lapTime2) {
  const diff = Math.abs(lapTimeToSeconds(lapTime1) - lapTimeToSeconds(lapTime2));
  return diff.toFixed(3);
}

// Helper function to convert time string to seconds
function timeStringToSeconds(timeString) {
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

// Helper function to convert seconds to time string
function secondsToTimeString(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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