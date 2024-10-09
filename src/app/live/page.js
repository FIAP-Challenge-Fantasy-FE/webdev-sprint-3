"use client";

import { useState, useEffect, useCallback, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Battery,
  Gauge,
  Zap,
  Send,
  Flag,
  Users,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  BarChart,
  LineChart as LineChartIcon,
  MapPin,
  TrendingUp,
  Lock,
  Unlock,
} from "lucide-react";
import Image from "next/image";
import {
  LineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  collection,
  doc,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  increment,
  serverTimestamp,
  limit,
  where,
  getDocs,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import YouTube from "react-youtube";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

export default function LivePage() {
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [raceData, setRaceData] = useState(null);
  const [latestLapData, setLatestLapData] = useState(null);
  const [betOptions, setBetOptions] = useState([]);
  const [nextLapBetOptions, setNextLapBetOptions] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [bettingTrends, setBettingTrends] = useState([]);
  const [userBets, setUserBets] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [betType, setBetType] = useState("");
  const [betDriver, setBetDriver] = useState("");
  const [betAmount, setBetAmount] = useState("");
  const [betMultiplier, setBetMultiplier] = useState(1);
  const [userPoints, setUserPoints] = useState(1000);
  const [showRaceDetails, setShowRaceDetails] = useState(false);
  const [isRaceFinished, setIsRaceFinished] = useState(false);
  const [showFinalDashboard, setShowFinalDashboard] = useState(false);
  const [currentRaceId, setCurrentRaceId] = useState(null);
  const [user, setUser] = useState(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginAction, setLoginAction] = useState(null);
  const [openBetting, setOpenBetting] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Authentication State
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        createOrUpdateUserProfile(user);
      }
    });
    return () => unsubscribe();
  }, []);

  // User Profile Management
  const createOrUpdateUserProfile = async (user) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Create new user profile
      await setDoc(userRef, {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        points: 1000, // Initial points for new users
        createdAt: serverTimestamp(),
      });
    } else {
      // Update last login
      await updateDoc(userRef, {
        lastLogin: serverTimestamp(),
      });
    }

    // Fetch and set user points
    const updatedUserSnap = await getDoc(userRef);
    const userData = updatedUserSnap.data();
    setUserPoints(userData.points);
  };

  // Handle Google Login
  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      setUser(user);
      await createOrUpdateUserProfile(user);
      setShowLoginDialog(false);
      if (loginAction) {
        loginAction();
        setLoginAction(null);
      }
    } catch (error) {
      console.error("Erro ao entrar com o Google", error);
    }
  };

  // Fetch Initial Data
  const fetchInitialData = useCallback(async () => {
    try {
      const [betOptionsSnapshot, nextLapBetOptionsSnapshot] = await Promise.all([
        getDocs(collection(db, "betOptions")),
        getDocs(collection(db, "nextLapBetOptions")),
      ]);

      setBetOptions(betOptionsSnapshot.docs.map((doc) => doc.data()));
      setNextLapBetOptions(
        nextLapBetOptionsSnapshot.docs.map((doc) => doc.data())
      );
    } catch (error) {
      console.error("Erro ao buscar dados iniciais:", error);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Listen to the Latest Race
  useEffect(() => {
    const racesQuery = query(
      collection(db, "races"),
      orderBy("startTime", "desc"),
      limit(1)
    );
    const unsubRaces = onSnapshot(racesQuery, (snapshot) => {
      if (!snapshot.empty) {
        const raceDoc = snapshot.docs[0];
        setCurrentRaceId(raceDoc.id);
        setRaceData(raceDoc.data());
        setIsRaceFinished(raceDoc.data().status === "finished");
      }
    });

    return () => unsubRaces();
  }, []);

  // Listen to Race Data Updates
  useEffect(() => {
    if (!currentRaceId) return;

    const raceDocRef = doc(db, "races", currentRaceId);
    const unsubRace = onSnapshot(raceDocRef, (doc) => {
      if (doc.exists()) {
        setRaceData(doc.data());
        setIsRaceFinished(doc.data().status === "finished");
        setDrivers(doc.data().drivers); // Updating drivers state
        setLatestLapData(doc.data().latestLapData);
      }
    });

    return () => unsubRace();
  }, [currentRaceId]);

  // Listen to Chat Messages
  useEffect(() => {
    if (!currentRaceId) return;

    const chatQuery = query(
      collection(db, "races", currentRaceId, "chatMessages"),
      orderBy("timestamp", "asc")
    );
    const unsubChat = onSnapshot(chatQuery, (snapshot) => {
      setChatMessages(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    });

    return () => unsubChat();
  }, [currentRaceId]);

  // Listen to User Bets
  useEffect(() => {
    if (!currentRaceId || !user) return;

    const userBetsQuery = query(
      collection(db, "races", currentRaceId, "userBets"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc")
    );

    const nextLapBetsQuery = query(
      collection(db, "races", currentRaceId, "nextLapBets"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc")
    );

    const unsubUserBets = onSnapshot(userBetsQuery, (snapshot) => {
      const bets = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUserBets((prevBets) => [
        ...prevBets.filter((bet) => bet.type.startsWith("nextLap")),
        ...bets,
      ]);
    });

    const unsubNextLapBets = onSnapshot(nextLapBetsQuery, (snapshot) => {
      const nextLapBets = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUserBets((prevBets) => [
        ...prevBets.filter((bet) => !bet.type.startsWith("nextLap")),
        ...nextLapBets,
      ]);
    });

    return () => {
      unsubUserBets();
      unsubNextLapBets();
    };
  }, [currentRaceId, user]);

  // Handle Sending Chat Messages
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!user) {
      setShowLoginDialog(true);
      setLoginAction(() => () => handleSendMessage());
      return;
    }
    if (newMessage.trim() && currentRaceId) {
      try {
        await addDoc(collection(db, "races", currentRaceId, "chatMessages"), {
          user: user.displayName,
          message: newMessage,
          avatar: user.photoURL,
          timestamp: serverTimestamp(),
        });
        setNewMessage("");
      } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
        // Optionally, display an error message to the user
      }
    }
  };

  // Handle Placing Bets
  const handlePlaceBet = async () => {
    if (!user) {
      setShowLoginDialog(true);
      setLoginAction(() => handlePlaceBet);
      return;
    }
    if (betType && betDriver && betAmount && Number(betAmount) <= userPoints) {
      const isNextLapBet = betType.startsWith("nextLap");
      const newBet = {
        userId: user.uid,
        type: betType,
        driver: betDriver,
        amount: Number(betAmount),
        multiplier: betMultiplier,
        status: "pending",
        points: 0,
        timestamp: serverTimestamp(),
      };

      try {
        // Add the new bet to Firestore
        await addDoc(
          collection(
            db,
            "races",
            currentRaceId,
            isNextLapBet ? "nextLapBets" : "userBets"
          ),
          newBet
        );

        // Update the user's points in Firestore and locally
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          points: increment(-Number(betAmount)),
        });
        setUserPoints((prevPoints) => prevPoints - Number(betAmount));

        // Update the betting trends in Firestore
        const trendDocRef = doc(
          db,
          "races",
          currentRaceId,
          "bettingTrends",
          betDriver
        );
        await updateDoc(trendDocRef, {
          bets: increment(Number(betAmount)),
        });

        // Reset bet inputs
        setBetType("");
        setBetDriver("");
        setBetAmount("");
        setBetMultiplier(1);
      } catch (error) {
        console.error("Erro ao fazer a aposta:", error);
        // Optionally, display an error message to the user
      }
    }
  };

  // Calculate Bet Multiplier
  const calculateBetMultiplier = useCallback(
    (betType, driverName) => {
      const driver = drivers.find((d) => d.name === driverName);
      if (!driver || !betType) return 1;

      let baseDifficulty = 1;
      const isNextLapBet = betType.startsWith("nextLap");
      const actualBetType = isNextLapBet
        ? betType.slice(7).toLowerCase()
        : betType;

      switch (actualBetType) {
        case "winner":
          baseDifficulty = 10 - (driver.position / drivers.length) * 5;
          break;
        case "fastestlap":
          baseDifficulty = 5;
          break;
        case "podiumfinish":
          baseDifficulty = 7 - (driver.position / drivers.length) * 3;
          break;
        case "topfive":
          baseDifficulty = 5 - (driver.position / drivers.length) * 2;
          break;
        case "overtakes":
          baseDifficulty = 4;
          break;
        case "energyefficiency":
          baseDifficulty = 3;
          break;
        default:
          baseDifficulty = 2;
      }

      if (isNextLapBet) {
        baseDifficulty *= 1.5; // Increase difficulty for next lap bets
      }

      const randomFactor = 0.8 + Math.random() * 0.4; // Random factor between 0.8 and 1.2
      return Math.max(1.1, +(baseDifficulty * randomFactor).toFixed(2));
    },
    [drivers]
  );

  // Update Bet Multiplier when betType or betDriver changes
  useEffect(() => {
    if (betType && betDriver) {
      const newMultiplier = calculateBetMultiplier(betType, betDriver);
      setBetMultiplier(newMultiplier);
    } else {
      setBetMultiplier(1);
    }
  }, [betType, betDriver, calculateBetMultiplier]);

  // Select Next Driver for Car Data Display
  const selectNextDriver = () => {
    if (!selectedDriver) return;
    const currentIndex = drivers.findIndex((d) => d.name === selectedDriver.name);
    const nextIndex = (currentIndex + 1) % drivers.length;
    setSelectedDriver(drivers[nextIndex]);
  };

  // Select Previous Driver for Car Data Display
  const selectPreviousDriver = () => {
    if (!selectedDriver) return;
    const currentIndex = drivers.findIndex((d) => d.name === selectedDriver.name);
    const previousIndex = (currentIndex - 1 + drivers.length) % drivers.length;
    setSelectedDriver(drivers[previousIndex]);
  };

  // Get Selected Driver's Latest Car Data
  const getDriverData = useCallback(
    (driverName) => {
      if (!raceData || !raceData.drivers) return { battery: 0, speed: 0, energy: 0 };
      const driver = raceData.drivers.find((d) => d.name === driverName);
      return driver || { battery: 0, speed: 0, energy: 0 };
    },
    [raceData]
  );

  const selectedDriverData = selectedDriver
    ? getDriverData(selectedDriver.name)
    : { battery: 0, speed: 0, energy: 0 };

  // Get Selected Driver's Stats
  const getDriverStats = useCallback(
    (driverName) => {
      if (!raceData || !raceData.drivers) return {};
      const driver = raceData.drivers.find((d) => d.name === driverName);
      if (!driver) return {};

      const { performance, energyManagement, overtakingData } = driver;
      return { ...performance, ...energyManagement, ...overtakingData };
    },
    [raceData]
  );

  // Race Dashboard Component
  const RaceDashboard = () => (
    <Dialog open={showFinalDashboard} onOpenChange={setShowFinalDashboard}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Painel da Corrida</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Resultados Finais</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {raceData?.drivers.map((driver, index) => (
                  <div
                    key={driver.name}
                    className="flex items-center justify-between py-2 border-b last:border-b-0"
                  >
                    <span>
                      {index + 1}. {driver.name}
                    </span>
                    <span>{driver.lapTime}</span>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Progressão do Tempo de Volta</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={raceData?.lapData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="lap" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {raceData?.drivers.map((driver, index) => (
                    <Line
                      key={driver.name}
                      type="monotone"
                      dataKey={`drivers.${index}.lapTime`}
                      name={driver.name}
                      stroke={`hsl(${(index * 360) / raceData.drivers.length}, 70%, 50%)`}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Energia</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={raceData?.drivers || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="energyManagement.energyUsed" fill="#8884d8" name="Energia Usada" />
                  <Bar dataKey="energyManagement.regeneration" fill="#82ca9d" name="Energia Regenerada" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Análise de Ultrapassagens</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={raceData?.drivers || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="overtakingData.overtakes" fill="#8884d8" name="Ultrapassagens" />
                  <Bar dataKey="overtakingData.defensiveActions" fill="#82ca9d" name="Ações Defensivas" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Update the renderCarData function
  const renderCarData = () => {
    if (!selectedDriver) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Dados do Carro: {selectedDriver.name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Velocidade</p>
              <p className="text-2xl font-bold">
                {Number(selectedDriver.speed).toFixed(2)} km/h
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bateria</p>
              <p className="text-2xl font-bold">
                {Number(selectedDriver.battery).toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Energia Usada</p>
              <p className="text-2xl font-bold">
                {Number(selectedDriver.energy).toFixed(2)} kWh
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Última Volta</p>
              <p className="text-2xl font-bold">{selectedDriver.lapTime}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  useEffect(() => {
    if (!selectedDriver && drivers.length > 0) {
      const interval = setInterval(() => {
        setSelectedDriver((prev) => {
          const currentIndex = drivers.findIndex((d) => d.name === prev?.name);
          const nextIndex = (currentIndex + 1) % drivers.length;
          return drivers[nextIndex];
        });
      }, 5000); // Change driver every 5 seconds

      return () => clearInterval(interval);
    }
  }, [drivers, selectedDriver]);

  const BettingForm = () => (
    <div className="space-y-4">
      <Tabs defaultValue="regular" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="regular">Regular Bets</TabsTrigger>
          <TabsTrigger value="nextLap">Next Lap Bets</TabsTrigger>
        </TabsList>
        <TabsContent value="regular">
          <div className="space-y-4">
            <Select value={betType} onValueChange={(value) => setBetType(value)}>
              <SelectTrigger>
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
            <Select value={betDriver} onValueChange={(value) => setBetDriver(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => (
                  <SelectItem key={driver.name} value={driver.name}>
                    {driver.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="Bet amount"
              max={userPoints}
            />
            {betType && betDriver && betAmount && (
              <div className="text-sm text-muted-foreground">
                <p>Potential Win: {(Number(betAmount) * betMultiplier || 0).toFixed(2)} points</p>
                <p>Multiplier: {betMultiplier.toFixed(2)}x</p>
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="nextLap">
          <div className="space-y-4">
            <Select value={betType} onValueChange={(value) => setBetType(`nextLap${value.charAt(0).toUpperCase() + value.slice(1)}`)}>
              <SelectTrigger>
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
            <Select value={betDriver} onValueChange={(value) => setBetDriver(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => (
                  <SelectItem key={driver.name} value={driver.name}>
                    {driver.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="Bet amount"
              max={userPoints}
            />
            {betType && betDriver && betAmount && (
              <div className="text-sm text-muted-foreground">
                <p>Potential Win: {(Number(betAmount) * betMultiplier || 0).toFixed(2)} points</p>
                <p>Multiplier: {betMultiplier.toFixed(2)}x</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      <Button
        onClick={handlePlaceBet}
        disabled={!betType || !betDriver || !betAmount || Number(betAmount) <= 0 || Number(betAmount) > userPoints || isRaceFinished}
        className="w-full"
      >
        Place Bet
      </Button>
    </div>
  );

  const BettingTrigger = forwardRef(({ children, ...props }, ref) => (
    <Button
      ref={ref}
      onClick={() => setOpenBetting(true)}
      className="w-full"
      disabled={isRaceFinished}
      {...props}
    >
      {children}
    </Button>
  ));

  BettingTrigger.displayName = "BettingTrigger";

  const BettingContent = ({ children }) => (
    <div className="px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Place Your Bet</h3>
        <p className="text-sm font-medium">Your Points: {userPoints}</p>
      </div>
      {children}
    </div>
  );

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-3xl font-bold text-center mb-6">
        Fórmula E: Monaco E-Prix
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Live Transmission Card */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-video bg-gray-900 flex items-center justify-center text-white relative">
                <YouTube
                  videoId="efq9LKuelIo"
                  className="w-full h-full object-cover"
                  opts={{
                    width: "100%",
                    height: "100%",
                    playerVars: {
                      autoplay: 1,
                      controls: 0,
                      loop: 1,
                      mute: 1,
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Race Status Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <span>Status da Corrida</span>
                <Flag className="w-5 h-5 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Voltas</p>
                  <p className="text-2xl font-bold">
                    {raceData?.raceStatus.lapsCompleted ?? 0}/
                    {raceData?.raceStatus.totalLaps ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Tempo Decorrido
                  </p>
                  <p className="text-2xl font-bold">
                    {raceData?.raceStatus.timeElapsed ?? "00:00:00"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Líder</p>
                  <p className="text-2xl font-bold">
                    {raceData?.latestLapData?.leader ?? "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Driver Car Data Card */}
          {selectedDriver && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-5 h-5" />
                    Dados do Carro: {selectedDriver.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={selectPreviousDriver}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Select
                      value={selectedDriver.name}
                      onValueChange={(value) =>
                        setSelectedDriver(
                          drivers.find((d) => d.name === value) || drivers[0]
                        )
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Selecione um piloto" />
                      </SelectTrigger>
                      <SelectContent>
                        {drivers.map((driver) => (
                          <SelectItem
                            key={driver.name}
                            value={driver.name}
                          >
                            {driver.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={selectNextDriver}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Bateria */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Battery className="w-4 h-4" />
                        <span>Bateria</span>
                      </div>
                      <span className="font-bold">
                        {Number(selectedDriverData.battery).toFixed(2)}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2.5">
                      <div
                        className="bg-primary h-2.5 rounded-full"
                        style={{ width: `${Number(selectedDriverData.battery).toFixed(2)}%` }}
                      ></div>
                    </div>
                  </div>
                  {/* Velocidade */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4" />
                        <span>Velocidade</span>
                      </div>
                      <span className="font-bold">
                        {Number(selectedDriverData.speed).toFixed(2)} km/h
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2.5">
                      <div
                        className="bg-primary h-2.5 rounded-full"
                        style={{
                          width: `${(selectedDriverData.speed / 250) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>  
                  {/* Energia Usada */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        <span>Energia Usada</span>
                      </div>
                      <span className="font-bold">
                        {Number(selectedDriverData.energy).toFixed(2)} kWh
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2.5">
                      <div
                        className="bg-primary h-2.5 rounded-full"
                        style={{
                          width: `${(selectedDriverData.energy / 30) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Race Details and Final Dashboard Buttons */}
          {isRaceFinished ? (
            <Button
              onClick={() => setShowFinalDashboard(true)}
              className="w-full"
            >
              Ver Painel da Corrida
            </Button>
          ) : (
            <Button onClick={() => setShowRaceDetails(true)} className="w-full">
              Ver Mais Detalhes da Corrida
            </Button>
          )}

          {/* Race Details Dialog */}
          <Dialog open={showRaceDetails} onOpenChange={setShowRaceDetails}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Detalhes da Corrida</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tendências de Apostas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart className="w-5 h-5" />
                      Tendências de Apostas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsBarChart data={raceData?.bettingTrends || []}>
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

                {/* Desempenho do Piloto */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LineChartIcon className="w-5 h-5" />
                      Desempenho do Piloto
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={raceData?.drivers || []}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="name" />
                        <PolarRadiusAxis angle={30} domain={[0, 250]} />
                        <Radar
                          name="Velocidade Média"
                          dataKey="performance.averageSpeed"
                          stroke="#8884d8"
                          fill="#8884d8"
                          fillOpacity={0.6}
                        />
                        <Radar
                          name="Consistência"
                          dataKey="performance.consistency"
                          stroke="#82ca9d"
                          fill="#82ca9d"
                          fillOpacity={0.6}
                        />
                        <Radar
                          name="Racecraft"
                          dataKey="performance.racecraft"
                          stroke="#ffc658"
                          fill="#ffc658"
                          fillOpacity={0.6}
                        />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Gestão de Energia */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Battery className="w-5 h-5" />
                      Gestão de Energia
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsBarChart
                        data={raceData?.drivers || []}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="energyManagement.energyUsed"
                          fill="#8884d8"
                          name="Energia Usada (kWh)"
                        />
                        <Bar
                          dataKey="energyManagement.regeneration"
                          fill="#82ca9d"
                          name="Energia Regenerada (kWh)"
                        />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Análise de Ultrapassagens */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Análise de Ultrapassagens
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsBarChart data={raceData?.drivers || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="overtakingData.overtakes"
                          fill="#8884d8"
                          name="Ultrapassagens"
                        />
                        <Bar
                          dataKey="overtakingData.defensiveActions"
                          fill="#82ca9d"
                          name="Ações Defensivas"
                        />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Sidebar with Tabs */}
        <div className="space-y-4">
          <Tabs defaultValue="leaderboard" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
              <TabsTrigger value="chat">Chat da Corrida</TabsTrigger>
              <TabsTrigger value="bets">Suas Apostas</TabsTrigger>
            </TabsList>
            <TabsContent value="leaderboard">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flag className="w-5 h-5" />
                    Leaderboard ao Vivo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {raceData?.drivers.map((driver) => (
                      <Popover key={driver.name}>
                        <PopoverTrigger asChild>
                          <div className="flex items-center justify-between py-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50">
                            <div className="flex items-center gap-3">
                              <div className="font-bold text-lg w-8">
                                {driver.position}
                              </div>
                              <Avatar className="w-10 h-10">
                                <AvatarImage
                                  src={driver.avatar}
                                  alt={driver.name}
                                />
                                <AvatarFallback>
                                  {driver.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold">
                                  {driver.name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {driver.team}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">
                                {driver.lapTime}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Última Volta
                              </div>
                            </div>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="grid gap-4">
                            <div className="space-y-2">
                              <h4 className="font-medium leading-none">
                                {driver.name}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {driver.team}
                              </p>
                            </div>
                            <div className="grid gap-2">
                              {Object.entries(getDriverStats(driver.name)).map(
                                ([key, value]) => (
                                  <div
                                    key={key}
                                    className="grid grid-cols-2 items-center gap-4"
                                  >
                                    <span className="text-sm">
                                      {key.charAt(0).toUpperCase() +
                                        key.slice(1)}
                                    </span>
                                    <span className="font-medium">
                                      {typeof value === "number"
                                        ? value.toFixed(2)
                                        : value}
                                    </span>
                                  </div>
                                )
                              )}
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
                  <CardTitle>Chat da Corrida</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className="flex items-start space-x-4 mb-4"
                      >
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
                  <form
                    onSubmit={handleSendMessage}
                    className="flex gap-2 mt-4"
                  >
                    <Input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Digite sua mensagem..."
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
                    Suas Apostas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {userBets.map((bet) => (
                      <div
                        key={bet.id}
                        className="flex items-center justify-between py-3 border-b last:border-b-0"
                      >
                        <div>
                          <p className="font-semibold">{bet.type}</p>
                          <p className="text-sm text-muted-foreground">
                            {bet.driver}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{bet.amount} pontos</p>
                          <p
                            className={`text-sm ${
                              bet.status === "won"
                                ? "text-green-500"
                                : bet.status === "lost"
                                ? "text-red-500"
                                : "text-muted-foreground"
                            }`}
                          >
                            {bet.status === "pending"
                              ? `${bet.multiplier}x`
                              : bet.status === "won"
                              ? `+${bet.points}`
                              : bet.status === "lost"
                              ? `-${bet.amount}`
                              : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Betting Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Betting</span>
                <DollarSign className="w-5 h-5 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isDesktop ? (
                <Dialog open={openBetting} onOpenChange={setOpenBetting}>
                  <DialogTrigger asChild>
                    <BettingTrigger>Open Betting</BettingTrigger>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Place Your Bet</DialogTitle>
                      <DialogDescription>
                        Choose your bet type, driver, and amount.
                      </DialogDescription>
                    </DialogHeader>
                    <BettingContent>
                      <BettingForm />
                    </BettingContent>
                  </DialogContent>
                </Dialog>
              ) : (
                <Drawer open={openBetting} onOpenChange={setOpenBetting}>
                  <DrawerTrigger asChild>
                    <BettingTrigger>Open Betting</BettingTrigger>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>Place Your Bet</DrawerTitle>
                      <DrawerDescription>
                        Choose your bet type, driver, and amount.
                      </DrawerDescription>
                    </DrawerHeader>
                    <BettingContent>
                      <BettingForm />
                    </BettingContent>
                  </DrawerContent>
                </Drawer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Components */}
        {/* You can add more components here if needed */}
      </div>

      {/* Race Dashboard Dialog */}
      <RaceDashboard />

      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login Necessário</DialogTitle>
            <DialogDescription>
              Por favor, faça login com sua conta do Google para continuar.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={handleLogin}>Entrar com o Google</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}