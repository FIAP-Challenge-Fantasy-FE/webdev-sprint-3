import { useState, useEffect } from 'react'
import { useRace } from '@/contexts/RaceContext'
import { useUser } from '@/hooks/useUser'
import { useToastContext } from '@/contexts/ToastContext'
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export const useBetting = () => {
  const { currentRaceId, drivers } = useRace()
  const { user, userProfile } = useUser()
  const { showToast } = useToastContext()
  const [userBets, setUserBets] = useState([])

  useEffect(() => {
    if (!currentRaceId || !user) return

    const userBetsQuery = query(
      collection(db, "races", currentRaceId, "userBets"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc")
    )

    const nextLapBetsQuery = query(
      collection(db, "races", currentRaceId, "nextLapBets"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc")
    )

    const unsubUserBets = onSnapshot(userBetsQuery, (snapshot) => {
      const bets = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setUserBets((prevBets) => [...prevBets.filter((bet) => bet.type.startsWith("nextLap")), ...bets])
    })

    const unsubNextLapBets = onSnapshot(nextLapBetsQuery, (snapshot) => {
      const nextLapBets = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setUserBets((prevBets) => [...prevBets.filter((bet) => !bet.type.startsWith("nextLap")), ...nextLapBets])
    })

    return () => {
      unsubUserBets()
      unsubNextLapBets()
    }
  }, [currentRaceId, user])

  const placeBet = async (betType, betDriver, betAmount, betMultiplier) => {
    if (!user || !currentRaceId || !userProfile) {
      showToast('User not authenticated or race not available', 'error')
      throw new Error('User not authenticated or race not available')
    }

    if (betAmount > userProfile.points) {
      showToast('Insufficient points', 'error')
      throw new Error('Insufficient points')
    }

    const isNextLapBet = betType.startsWith("nextLap")
    const newBet = {
      userId: user.uid,
      type: betType,
      driver: betDriver,
      amount: betAmount,
      multiplier: betMultiplier,
      status: "pending",
      points: 0,
      timestamp: serverTimestamp(),
    }

    try {
      await addDoc(collection(db, "races", currentRaceId, isNextLapBet ? "nextLapBets" : "userBets"), newBet)

      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        points: increment(-betAmount),
      })

      const trendDocRef = doc(db, "races", currentRaceId, "bettingTrends", betDriver)
      await updateDoc(trendDocRef, {
        bets: increment(betAmount),
      })

      showToast('Bet placed successfully', 'success')
      return true
    } catch (error) {
      console.error("Error placing bet:", error)
      showToast('Error placing bet. Please try again.', 'error')
      throw error
    }
  }

  const calculateBetMultiplier = (betType, driverName) => {
    const driver = drivers.find((d) => d.name === driverName)
    if (!driver || !betType) return 1

    let baseDifficulty = 1
    const isNextLapBet = betType.startsWith("nextLap")
    const actualBetType = isNextLapBet ? betType.slice(7).toLowerCase() : betType

    switch (actualBetType) {
      case "winner":
        baseDifficulty = 10 - (driver.position / drivers.length) * 5
        break
      case "fastestlap":
        baseDifficulty = 5
        break
      case "podiumfinish":
        baseDifficulty = 7 - (driver.position / drivers.length) * 3
        break
      case "topfive":
        baseDifficulty = 5 - (driver.position / drivers.length) * 2
        break
      case "overtakes":
        baseDifficulty = 4
        break
      case "energyefficiency":
        baseDifficulty = 3
        break
      default:
        baseDifficulty = 2
    }

    if (isNextLapBet) {
      baseDifficulty *= 1.5 // Increase difficulty for next lap bets
    }

    const randomFactor = 0.8 + Math.random() * 0.4 // Random factor between 0.8 and 1.2
    return Math.max(1.1, +(baseDifficulty * randomFactor).toFixed(2))
  }

  return { userBets, placeBet, calculateBetMultiplier }
}