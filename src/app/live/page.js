'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Battery, Gauge, Zap, Send, Flag, Users, DollarSign, ChevronLeft, ChevronRight, BarChart, LineChart as LineChartIcon, MapPin, TrendingUp } from "lucide-react"
import Image from "next/image"
import { LineChart, Line, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { collection, doc, query, orderBy, onSnapshot, addDoc, updateDoc, increment, serverTimestamp, limit, where, getDocs, getDoc, setDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'

export default function LivePage() {
  const [drivers, setDrivers] = useState([])
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [initialRaceStatus, setInitialRaceStatus] = useState(null)
  const [raceStatus, setRaceStatus] = useState(null)
  const [initialChatMessages, setInitialChatMessages] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const [betOptions, setBetOptions] = useState([])
  const [nextLapBetOptions, setNextLapBetOptions] = useState([])
  const [lapData, setLapData] = useState([])
  const [bettingTrends, setBettingTrends] = useState([])
  const [driverPerformance, setDriverPerformance] = useState([])
  const [energyManagement, setEnergyManagement] = useState([])
  const [overtakingData, setOvertakingData] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [betType, setBetType] = useState("")
  const [betDriver, setBetDriver] = useState("")
  const [betAmount, setBetAmount] = useState("")
  const [userPoints, setUserPoints] = useState(1000)
  const [showRaceDetails, setShowRaceDetails] = useState(false)
  const [isRaceFinished, setIsRaceFinished] = useState(false)
  const [showFinalDashboard, setShowFinalDashboard] = useState(false)
  const [userBets, setUserBets] = useState([])
  const [nextLapBetType, setNextLapBetType] = useState("")
  const [nextLapBetDriver, setNextLapBetDriver] = useState("")
  const [nextLapBetAmount, setNextLapBetAmount] = useState("")
  const [currentRaceId, setCurrentRaceId] = useState(null)
  const [user, setUser] = useState(null)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [loginAction, setLoginAction] = useState(null)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user)
    })
    return () => unsubscribe()
  }, [])

  const createOrUpdateUserProfile = async (user) => {
    const userRef = doc(db, 'users', user.uid)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      // Create new user profile
      await setDoc(userRef, {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        points: 1000, // Initial points for new users
        createdAt: serverTimestamp(),
      })
    } else {
      // User profile exists, update last login
      await updateDoc(userRef, {
        lastLogin: serverTimestamp(),
      })
    }

    // Fetch and set user points
    const updatedUserSnap = await getDoc(userRef)
    const userData = updatedUserSnap.data()
    setUserPoints(userData.points)
  }

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      setUser(user)
      await createOrUpdateUserProfile(user)
      setShowLoginDialog(false)
      if (loginAction) {
        loginAction()
        setLoginAction(null)
      }
    } catch (error) {
      console.error("Error signing in with Google", error)
    }
  }

  const fetchInitialData = useCallback(async () => {
    try {
      const [driversSnapshot, raceStatusDoc, chatMessagesSnapshot, betOptionsSnapshot, nextLapBetOptionsSnapshot] = await Promise.all([
        getDocs(collection(db, 'drivers')),
        getDoc(doc(db, 'initialRaceStatus', 'default')),
        getDocs(collection(db, 'initialChatMessages')),
        getDocs(collection(db, 'betOptions')),
        getDocs(collection(db, 'nextLapBetOptions'))
      ])

      const driversData = driversSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setDrivers(driversData)
      if (driversData.length > 0) {
        setSelectedDriver(driversData[0])
      }
      setInitialRaceStatus(raceStatusDoc.exists() ? raceStatusDoc.data() : null)
      setInitialChatMessages(chatMessagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setBetOptions(betOptionsSnapshot.docs.map(doc => doc.data()))
      setNextLapBetOptions(nextLapBetOptionsSnapshot.docs.map(doc => doc.data()))
    } catch (error) {
      console.error("Error fetching initial data:", error)
    }
  }, [])

  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  useEffect(() => {
    if (initialRaceStatus && !raceStatus) {
      setRaceStatus(initialRaceStatus)
    }
    if (initialChatMessages.length > 0 && chatMessages.length === 0) {
      setChatMessages(initialChatMessages)
    }
  }, [initialRaceStatus, raceStatus, initialChatMessages, chatMessages])

  useEffect(() => {
    const racesQuery = query(collection(db, 'races'), orderBy('startTime', 'desc'), limit(1))
    const unsubRaces = onSnapshot(racesQuery, (snapshot) => {
      if (!snapshot.empty) {
        const raceDoc = snapshot.docs[0]
        setCurrentRaceId(raceDoc.id)
        setRaceStatus(raceDoc.data().status)
      }
    })

    return () => unsubRaces()
  }, [])

  useEffect(() => {
    if (!currentRaceId) return

    const unsubscribers = [
      onSnapshot(doc(db, 'races', currentRaceId), (doc) => {
        if (doc.exists()) {
          setRaceStatus(doc.data().status)
        }
      }),
      onSnapshot(query(collection(db, 'races', currentRaceId, 'lapData'), orderBy('lap', 'asc')), (snapshot) => {
        setLapData(snapshot.docs.map(doc => doc.data()))
      }),
      onSnapshot(collection(db, 'races', currentRaceId, 'bettingTrends'), (snapshot) => {
        setBettingTrends(snapshot.docs.map(doc => doc.data()))
      }),
      onSnapshot(collection(db, 'races', currentRaceId, 'driverPerformance'), (snapshot) => {
        setDriverPerformance(snapshot.docs.map(doc => doc.data()))
      }),
      onSnapshot(collection(db, 'races', currentRaceId, 'energyManagement'), (snapshot) => {
        setEnergyManagement(snapshot.docs.map(doc => doc.data()))
      }),
      onSnapshot(collection(db, 'races', currentRaceId, 'overtakingData'), (snapshot) => {
        setOvertakingData(snapshot.docs.map(doc => doc.data()))
      })
    ]

    return () => unsubscribers.forEach(unsubscribe => unsubscribe())
  }, [currentRaceId])

  useEffect(() => {
    if (!currentRaceId) return

    const chatQuery = query(
      collection(db, 'races', currentRaceId, 'chatMessages'), 
      orderBy('timestamp', 'asc')
    )
    const unsubChat = onSnapshot(chatQuery, (snapshot) => {
      setChatMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })

    return () => unsubChat()
  }, [currentRaceId])

  useEffect(() => {
    if (!currentRaceId || !user) return

    const userBetsQuery = query(
      collection(db, 'races', currentRaceId, 'userBets'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    )

    const unsubUserBets = onSnapshot(userBetsQuery, (snapshot) => {
      const bets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setUserBets(bets)
    })

    return () => unsubUserBets()
  }, [currentRaceId, user])

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault()
    if (!user) {
      setShowLoginDialog(true)
      setLoginAction(() => () => handleSendMessage())
      return
    }
    if (newMessage.trim() && currentRaceId) {
      try {
        await addDoc(collection(db, 'races', currentRaceId, 'chatMessages'), {
          user: user.displayName,
          message: newMessage,
          avatar: user.photoURL,
          timestamp: serverTimestamp(),
        })
        setNewMessage('')
      } catch (error) {
        console.error("Error sending message:", error)
        // You might want to show an error message to the user here
      }
    }
  }

  const handlePlaceBet = async () => {
    if (!user) {
      setShowLoginDialog(true)
      setLoginAction(() => handlePlaceBet)
      return
    }
    if (betType && betDriver && betAmount && Number(betAmount) <= userPoints) {
      const multiplier = calculateBetMultiplier(betType, betDriver)
      const newBet = {
        userId: user.uid,
        type: betType,
        driver: betDriver,
        amount: Number(betAmount),
        multiplier,
        status: 'pending',
        points: 0,
        timestamp: serverTimestamp(),
      }
      
      try {
        // Add the new bet to Firestore
        await addDoc(collection(db, 'races', currentRaceId, 'userBets'), newBet)
        
        // Update user points in Firestore and locally
        const userRef = doc(db, 'users', user.uid)
        await updateDoc(userRef, {
          points: increment(-Number(betAmount))
        })
        setUserPoints((prevPoints) => prevPoints - Number(betAmount))
        
        // Update betting trends in Firestore
        const trendDocRef = doc(db, 'races', currentRaceId, 'bettingTrends', betDriver)
        await updateDoc(trendDocRef, {
          bets: increment(Number(betAmount)),
        })
        
        // Reset bet inputs
        setBetType('')
        setBetDriver('')
        setBetAmount('')
      } catch (error) {
        console.error("Error placing bet:", error)
        // You might want to show an error message to the user here
      }
    }
  }

  const handlePlaceNextLapBet = async () => {
    if (!user) {
      setShowLoginDialog(true)
      setLoginAction(() => handlePlaceNextLapBet)
      return
    }
    if (nextLapBetType && nextLapBetDriver && nextLapBetAmount && Number(nextLapBetAmount) <= userPoints) {
      const multiplier = calculateBetMultiplier(nextLapBetType, nextLapBetDriver)
      const newBet = {
        userId: user.uid,
        type: `nextLap${nextLapBetType.charAt(0).toUpperCase() + nextLapBetType.slice(1)}`,
        driver: nextLapBetDriver,
        amount: Number(nextLapBetAmount),
        multiplier,
        status: 'pending',
        points: 0,
        timestamp: serverTimestamp(),
      }
      
      try {
        // Add the new bet to Firestore
        await addDoc(collection(db, 'races', currentRaceId, 'nextLapBets'), newBet)
        
        // Update user points locally
        setUserPoints(prevPoints => prevPoints - Number(nextLapBetAmount))
        
        // Update betting trends in Firestore
        const trendDocRef = doc(db, 'races', currentRaceId, 'bettingTrends', nextLapBetDriver)
        await updateDoc(trendDocRef, {
          bets: increment(Number(nextLapBetAmount)),
        })
        
        // Reset bet inputs
        setNextLapBetType("")
        setNextLapBetDriver("")
        setNextLapBetAmount("")
      } catch (error) {
        console.error("Error placing next lap bet:", error)
        // You might want to show an error message to the user here
      }
    }
  }

  const calculateBetMultiplier = (betType, driverName) => {
    const driver = drivers.find(d => d.name === driverName)
    if (!driver) return 1

    let baseDifficulty = 1
    switch (betType) {
      case 'winner':
        baseDifficulty = 10 - (driver.position / drivers.length) * 5
        break
      case 'fastestLap':
        baseDifficulty = 5
        break
      case 'podiumFinish':
        baseDifficulty = 7 - (driver.position / drivers.length) * 3
        break
      case 'topFive':
        baseDifficulty = 5 - (driver.position / drivers.length) * 2
        break
      case 'overtakes':
        baseDifficulty = 4
        break
      case 'energyEfficiency':
        baseDifficulty = 3
        break
    }

    const randomFactor = 0.8 + Math.random() * 0.4 // Random factor between 0.8 and 1.2
    return +(baseDifficulty * randomFactor).toFixed(2)
  }

  const selectNextDriver = () => {
    const currentIndex = drivers.findIndex(d => d.id === selectedDriver.id)
    const nextIndex = (currentIndex + 1) % drivers.length
    setSelectedDriver(drivers[nextIndex])
  }

  const selectPreviousDriver = () => {
    const currentIndex = drivers.findIndex(d => d.id === selectedDriver.id)
    const previousIndex = (currentIndex - 1 + drivers.length) % drivers.length
    setSelectedDriver(drivers[previousIndex])
  }

  const getDriverData = useCallback((driverName) => {
    const driverCarData = lapData.flatMap((lap) => lap.drivers.filter((d) => d.name === driverName))
    return driverCarData[driverCarData.length - 1] || { battery: 0, speed: 0, energy: 0 }
  }, [lapData])

  const selectedDriverData = selectedDriver ? getDriverData(selectedDriver.name) : { battery: 0, speed: 0, energy: 0 }

  const getDriverStats = useCallback((driverName) => {
    const performance = driverPerformance.find(d => d.name === driverName) || { averageSpeed: 0, consistency: 0, racecraft: 0 }
    const energy = energyManagement.find(d => d.name === driverName) || { energyUsed: 0, regeneration: 0, efficiency: 0 }
    const overtaking = overtakingData.find(d => d.name === driverName) || { overtakes: 0, defensiveActions: 0 }
    return { ...performance, ...energy, ...overtaking }
  }, [driverPerformance, energyManagement, overtakingData])

  const RaceDashboard = () => (
    <Dialog open={showFinalDashboard} onOpenChange={setShowFinalDashboard}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Race Dashboard</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Final Standings</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {lapData.length > 0 && lapData[lapData.length - 1].drivers.map((driver, index) => (
                  <div key={driver.name} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <span>{index + 1}. {driver.name}</span>
                    <span>{driver.lapTime}</span>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Lap Time Progression</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lapData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="lap" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {drivers.map((driver, index) => (
                    <Line 
                      key={driver.name} 
                      type="monotone" 
                      dataKey={`drivers[${index}].lapTime`} 
                      name={driver.name} 
                      stroke={`hsl(${index * 360 / drivers.length}, 70%, 50%)`} 
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Energy Management</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={energyManagement}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="energyUsed" fill="#8884d8" name="Energy Used" />
                  <Bar dataKey="regeneration" fill="#82ca9d" name="Energy Regenerated" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Overtaking Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={overtakingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="overtakes" fill="#8884d8" name="Overtakes" />
                  <Bar dataKey="defensiveActions" fill="#82ca9d" name="Defensive Actions" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )

  const renderCarData = () => {
    if (lapData.length === 0) return null

    const latestLap = lapData[lapData.length - 1]
    return (
      <div>
        <h3>Car Data (Lap {latestLap.lap})</h3>
        {latestLap.drivers.map((driver) => (
          <div key={driver.name}>
            <p>{driver.name}: Speed: {driver.speed} km/h, Battery: {driver.battery}%, Energy: {driver.energy} kWh</p>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-3xl font-bold text-center mb-6">Formula E: Monaco E-Prix</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-video bg-gray-900 flex items-center justify-center text-white relative">
                <Image src="/placeholder.svg?height=720&width=1280" alt="Live Stream" width={1280} height={720} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  {isRaceFinished ? (
                    <p className="text-2xl font-bold">Race Finished</p>
                  ) : (
                    <p className="text-2xl font-bold">Live Stream</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <span>Race Status</span>
                <Flag className="w-5 h-5 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Laps</p>
                  <p className="text-2xl font-bold">{raceStatus?.lapsCompleted ?? 0}/{raceStatus?.totalLaps ?? 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time Elapsed</p>
                  <p className="text-2xl font-bold">{raceStatus?.timeElapsed ?? "00:00:00"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Leader</p>
                  <p className="text-2xl font-bold">{lapData.length > 0 ? lapData[lapData.length - 1].leader : "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedDriver && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-5 h-5" />
                    Car Data: {selectedDriver.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" onClick={selectPreviousDriver}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Select value={selectedDriver.id.toString()} onValueChange={(value) => setSelectedDriver(drivers.find(d => d.id === parseInt(value)) || drivers[0])}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select a driver" />
                      </SelectTrigger>
                      <SelectContent>
                        {drivers.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id.toString()}>
                            {driver.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="icon" variant="outline" onClick={selectNextDriver}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Battery className="w-4 h-4" />
                        <span>Battery</span>
                      </div>
                      <span className="font-bold">{selectedDriverData.battery}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2.5">
                      <div className="bg-primary h-2.5 rounded-full" style={{ width: `${selectedDriverData.battery}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4" />
                        <span>Speed</span>
                      </div>
                      <span className="font-bold">{selectedDriverData.speed} km/h</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2.5">
                      <div className="bg-primary h-2.5 rounded-full" style={{ width: `${(selectedDriverData.speed / 250) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        <span>Energy Used</span>
                      </div>
                      <span className="font-bold">{selectedDriverData.energy} kWh</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2.5">
                      <div className="bg-primary h-2.5 rounded-full" style={{ width: `${(selectedDriverData.energy / 30) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isRaceFinished ? (
            <Button onClick={() => setShowFinalDashboard(true)} className="w-full">
              View Race Dashboard
            </Button>
          ) : (
            <Button onClick={() => setShowRaceDetails(true)} className="w-full">
              See More Race Details
            </Button>
          )}

          <Dialog open={showRaceDetails} onOpenChange={setShowRaceDetails}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Race Details</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart className="w-5 h-5" />
                      Betting Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsBarChart data={bettingTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="bets" fill="#8884d8" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LineChartIcon className="w-5 h-5" />
                      Driver Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={driverPerformance}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="name" />
                        <PolarRadiusAxis angle={30} domain={[0, 250]} />
                        <Radar name="Average Speed" dataKey="averageSpeed" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                        <Radar name="Consistency" dataKey="consistency" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                        <Radar name="Racecraft" dataKey="racecraft" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Battery className="w-5 h-5" />
                      Energy Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsBarChart data={energyManagement} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="energyUsed" fill="#8884d8" name="Energy Used (kWh)" />
                        <Bar dataKey="regeneration" fill="#82ca9d" name="Energy Regenerated (kWh)" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Overtaking Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsBarChart data={overtakingData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="overtakes" fill="#8884d8" name="Overtakes" />
                        <Bar dataKey="defensiveActions" fill="#82ca9d" name="Defensive Actions" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          <Tabs defaultValue="leaderboard" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
              <TabsTrigger value="chat">Live Chat</TabsTrigger>
              <TabsTrigger value="bets">Your Bets</TabsTrigger>
            </TabsList>
            <TabsContent value="leaderboard">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flag className="w-5 h-5" />
                    Live Leaderboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {lapData.length > 0 && lapData[lapData.length - 1].drivers.map((driver) => (
                      <Popover key={driver.name}>
                        <PopoverTrigger asChild>
                          <div className="flex items-center justify-between py-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50">
                            <div className="flex items-center gap-3">
                              <div className="font-bold text-lg w-8">{driver.position}</div>
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={drivers.find(d => d.name === driver.name)?.avatar} alt={driver.name} />
                                <AvatarFallback>{driver.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold">{driver.name}</div>
                                <div className="text-sm text-muted-foreground">{drivers.find(d => d.name === driver.name)?.team}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{driver.lapTime}</div>
                              <div className="text-sm text-muted-foreground">Last Lap</div>
                            </div>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="grid gap-4">
                            <div className="space-y-2">
                              <h4 className="font-medium leading-none">{driver.name}</h4>
                              <p className="text-sm text-muted-foreground">{drivers.find(d => d.name === driver.name)?.team}</p>
                            </div>
                            <div className="grid gap-2">
                              {Object.entries(getDriverStats(driver.name)).map(([key, value]) => (
                                <div key={key} className="grid grid-cols-2 items-center gap-4">
                                  <span className="text-sm">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                                  <span className="font-medium">{typeof value === 'number' ? value.toFixed(2) : value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="chat">
              <Card>
                <CardHeader>
                  <CardTitle>Race Chat</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {chatMessages.map((message) => (
                      <div key={message.id} className="flex items-start space-x-4 mb-4">
                        <Avatar>
                          <AvatarImage src={message.avatar} alt={message.user} />
                          <AvatarFallback>{message.user[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{message.user}</p>
                          <p>{message.message}</p>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                  <form onSubmit={handleSendMessage} className="flex gap-2 mt-4">
                    <Input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-grow"
                    />
                    <Button type="submit" size="icon">
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="bets">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Your Bets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {userBets.map((bet) => (
                      <div key={bet.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                        <div>
                          <p className="font-semibold">{bet.type}</p>
                          <p className="text-sm text-muted-foreground">{bet.driver}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{bet.amount} points</p>
                          <p className={`text-sm ${bet.status === 'won' ? 'text-green-500' : bet.status === 'lost' ? 'text-red-500' : 'text-muted-foreground'}`}>
                            {bet.status === 'pending' ? `${bet.multiplier}x` : bet.status === 'won' ? `+${bet.points}` : bet.status === 'lost' ? `-${bet.amount}` : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Your Points</span>
                <DollarSign className="w-5 h-5 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{userPoints}</p>
              <p className="text-sm text-muted-foreground mt-1">+5 points every 5 seconds for watching</p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full mt-2" disabled={isRaceFinished}>Place a Bet</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Place Your Bet</DialogTitle>
                    <DialogDescription>
                      Choose your bet type, driver, and amount. Good luck!
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="betType" className="text-right">
                        Bet Type
                      </label>
                      <Select value={betType} onValueChange={setBetType}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select bet type" />
                        </SelectTrigger>
                        <SelectContent>
                          {betOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="betDriver" className="text-right">
                        Driver
                      </label>
                      <Select value={betDriver} onValueChange={setBetDriver}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select driver" />
                        </SelectTrigger>
                        <SelectContent>
                          {drivers.map((driver) => (
                            <SelectItem key={driver.id} value={driver.name}>
                              {driver.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="betAmount" className="text-right">
                        Amount
                      </label>
                      <Input
                        id="betAmount"
                        type="number"
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        className="col-span-3"
                        max={userPoints}
                      />
                    </div>
                  </div>
                  <Button onClick={handlePlaceBet} disabled={!betType || !betDriver || !betAmount || Number(betAmount) > userPoints}>
                    Place Bet
                  </Button>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Next Lap Bet</span>
                <TrendingUp className="w-5 h-5 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="nextLapBetType" className="text-right">
                    Bet Type
                  </label>
                  <Select value={nextLapBetType} onValueChange={setNextLapBetType}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select bet type" />
                    </SelectTrigger>
                    <SelectContent>
                      {nextLapBetOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="nextLapBetDriver" className="text-right">
                    Driver
                  </label>
                  <Select value={nextLapBetDriver} onValueChange={setNextLapBetDriver}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.name}>
                          {driver.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="nextLapBetAmount" className="text-right">
                    Amount
                  </label>
                  <Input
                    id="nextLapBetAmount"
                    type="number"
                    value={nextLapBetAmount}
                    onChange={(e) => setNextLapBetAmount(e.target.value)}
                    className="col-span-3"
                    max={userPoints}
                  />
                </div>
                <Button onClick={handlePlaceNextLapBet} disabled={!nextLapBetType || !nextLapBetDriver || !nextLapBetAmount || Number(nextLapBetAmount) > userPoints || isRaceFinished}>
                  Place Next Lap Bet
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <RaceDashboard />

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              Please log in with your Google account to continue.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={handleLogin}>
            Log in with Google
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}