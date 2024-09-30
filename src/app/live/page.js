"use client";

import { useState, useEffect, useCallback } from "react";
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

export default function LivePage() {
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [initialRaceStatus, setInitialRaceStatus] = useState(null);
  const [raceStatus, setRaceStatus] = useState(null);
  const [initialChatMessages, setInitialChatMessages] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [betOptions, setBetOptions] = useState([]);
  const [nextLapBetOptions, setNextLapBetOptions] = useState([]);
  const [lapData, setLapData] = useState([]);
  const [bettingTrends, setBettingTrends] = useState([]);
  const [driverPerformance, setDriverPerformance] = useState([]);
  const [energyManagement, setEnergyManagement] = useState([]);
  const [overtakingData, setOvertakingData] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [betType, setBetType] = useState("");
  const [betDriver, setBetDriver] = useState("");
  const [betAmount, setBetAmount] = useState("");
  const [betMultiplier, setBetMultiplier] = useState(1);
  const [userPoints, setUserPoints] = useState(1000);
  const [showRaceDetails, setShowRaceDetails] = useState(false);
  const [isRaceFinished, setIsRaceFinished] = useState(false);
  const [showFinalDashboard, setShowFinalDashboard] = useState(false);
  const [userBets, setUserBets] = useState([]);
  const [currentRaceId, setCurrentRaceId] = useState(null);
  const [user, setUser] = useState(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginAction, setLoginAction] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const createOrUpdateUserProfile = async (user) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Cria novo perfil de usuário
      await setDoc(userRef, {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        points: 1000, // Pontos iniciais para novos usuários
        createdAt: serverTimestamp(),
      });
    } else {
      // Perfil de usuário existe, atualiza último login
      await updateDoc(userRef, {
        lastLogin: serverTimestamp(),
      });
    }

    // Busca e define os pontos do usuário
    const updatedUserSnap = await getDoc(userRef);
    const userData = updatedUserSnap.data();
    setUserPoints(userData.points);
  };

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

  const fetchInitialData = useCallback(async () => {
    try {
      const [
        driversSnapshot,
        raceStatusDoc,
        chatMessagesSnapshot,
        betOptionsSnapshot,
        nextLapBetOptionsSnapshot,
      ] = await Promise.all([
        getDocs(collection(db, "drivers")),
        getDoc(doc(db, "initialRaceStatus", "default")),
        getDocs(collection(db, "initialChatMessages")),
        getDocs(collection(db, "betOptions")),
        getDocs(collection(db, "nextLapBetOptions")),
      ]);

      const driversData = driversSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDrivers(driversData);
      if (driversData.length > 0) {
        setSelectedDriver(driversData[0]);
      }
      setInitialRaceStatus(
        raceStatusDoc.exists() ? raceStatusDoc.data() : null
      );
      setInitialChatMessages(
        chatMessagesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
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

  useEffect(() => {
    if (initialRaceStatus && !raceStatus) {
      setRaceStatus(initialRaceStatus);
    }
    if (initialChatMessages.length > 0 && chatMessages.length === 0) {
      setChatMessages(initialChatMessages);
    }
  }, [initialRaceStatus, raceStatus, initialChatMessages, chatMessages]);

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
        setRaceStatus(raceDoc.data().status);
      }
    });

    return () => unsubRaces();
  }, []);

  useEffect(() => {
    if (!currentRaceId) return;

    const unsubscribers = [
      onSnapshot(doc(db, "races", currentRaceId), (doc) => {
        if (doc.exists()) {
          setRaceStatus(doc.data().status);
        }
      }),
      onSnapshot(
        query(
          collection(db, "races", currentRaceId, "lapData"),
          orderBy("lap", "asc")
        ),
        (snapshot) => {
          setLapData(snapshot.docs.map((doc) => doc.data()));
        }
      ),
      onSnapshot(
        collection(db, "races", currentRaceId, "bettingTrends"),
        (snapshot) => {
          setBettingTrends(snapshot.docs.map((doc) => doc.data()));
        }
      ),
      onSnapshot(
        collection(db, "races", currentRaceId, "driverPerformance"),
        (snapshot) => {
          setDriverPerformance(snapshot.docs.map((doc) => doc.data()));
        }
      ),
      onSnapshot(
        collection(db, "races", currentRaceId, "energyManagement"),
        (snapshot) => {
          setEnergyManagement(snapshot.docs.map((doc) => doc.data()));
        }
      ),
      onSnapshot(
        collection(db, "races", currentRaceId, "overtakingData"),
        (snapshot) => {
          setOvertakingData(snapshot.docs.map((doc) => doc.data()));
        }
      ),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [currentRaceId]);

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
        // Você pode querer exibir uma mensagem de erro para o usuário aqui
      }
    }
  };

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
        // Adiciona a nova aposta no Firestore
        await addDoc(
          collection(
            db,
            "races",
            currentRaceId,
            isNextLapBet ? "nextLapBets" : "userBets"
          ),
          newBet
        );

        // Atualiza os pontos do usuário no Firestore e localmente
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          points: increment(-Number(betAmount)),
        });
        setUserPoints((prevPoints) => prevPoints - Number(betAmount));

        // Atualiza as tendências de apostas no Firestore
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

        // Reseta os inputs da aposta
        setBetType("");
        setBetDriver("");
        setBetAmount("");
        setBetMultiplier(1);
      } catch (error) {
        console.error("Erro ao fazer a aposta:", error);
        // Você pode querer exibir uma mensagem de erro para o usuário aqui
      }
    }
  };

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
        baseDifficulty *= 1.5; // Aumenta a dificuldade para apostas na próxima volta
      }

      const randomFactor = 0.8 + Math.random() * 0.4; // Fator aleatório entre 0.8 e 1.2
      return Math.max(1.1, +(baseDifficulty * randomFactor).toFixed(2));
    },
    [drivers]
  );

  useEffect(() => {
    if (betType && betDriver) {
      const newMultiplier = calculateBetMultiplier(betType, betDriver);
      setBetMultiplier(newMultiplier);
    } else {
      setBetMultiplier(1);
    }
  }, [betType, betDriver, calculateBetMultiplier]);

  const selectNextDriver = () => {
    const currentIndex = drivers.findIndex((d) => d.id === selectedDriver.id);
    const nextIndex = (currentIndex + 1) % drivers.length;
    setSelectedDriver(drivers[nextIndex]);
  };

  const selectPreviousDriver = () => {
    const currentIndex = drivers.findIndex((d) => d.id === selectedDriver.id);
    const previousIndex = (currentIndex - 1 + drivers.length) % drivers.length;
    setSelectedDriver(drivers[previousIndex]);
  };

  const getDriverData = useCallback(
    (driverName) => {
      const driverCarData = lapData.flatMap((lap) =>
        lap.drivers.filter((d) => d.name === driverName)
      );
      return (
        driverCarData[driverCarData.length - 1] || {
          battery: 0,
          speed: 0,
          energy: 0,
        }
      );
    },
    [lapData]
  );

  const selectedDriverData = selectedDriver
    ? getDriverData(selectedDriver.name)
    : { battery: 0, speed: 0, energy: 0 };

  const getDriverStats = useCallback(
    (driverName) => {
      const performance = driverPerformance.find(
        (d) => d.name === driverName
      ) || { averageSpeed: 0, consistency: 0, racecraft: 0 };
      const energy = energyManagement.find((d) => d.name === driverName) || {
        energyUsed: 0,
        regeneration: 0,
        efficiency: 0,
      };
      const overtaking = overtakingData.find((d) => d.name === driverName) || {
        overtakes: 0,
        defensiveActions: 0,
      };
      return { ...performance, ...energy, ...overtaking };
    },
    [driverPerformance, energyManagement, overtakingData]
  );

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
                {lapData.length > 0 &&
                  lapData[lapData.length - 1].drivers.map((driver, index) => (
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
                      stroke={`hsl(${
                        (index * 360) / drivers.length
                      }, 70%, 50%)`}
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
                <RechartsBarChart data={energyManagement}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="energyUsed"
                    fill="#8884d8"
                    name="Energia Usada"
                  />
                  <Bar
                    dataKey="regeneration"
                    fill="#82ca9d"
                    name="Energia Regenerada"
                  />
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
                <RechartsBarChart data={overtakingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="overtakes"
                    fill="#8884d8"
                    name="Ultrapassagens"
                  />
                  <Bar
                    dataKey="defensiveActions"
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
  );

  const renderCarData = () => {
    if (lapData.length === 0) return null;

    const latestLap = lapData[lapData.length - 1];
    return (
      <div>
        <h3>Dados do Carro (Volta {latestLap.lap})</h3>
        {latestLap.drivers.map((driver) => (
          <div key={driver.name}>
            <p>
              {driver.name}: Velocidade: {driver.speed} km/h, Bateria:{" "}
              {driver.battery}%, Energia: {driver.energy} kWh
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-3xl font-bold text-center mb-6">
        Fórmula E: Monaco E-Prix
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-video bg-gray-900 flex items-center justify-center text-white relative">
                <Image
                  src="/placeholder.svg?height=720&width=1280"
                  alt="Transmissão ao Vivo"
                  width={1280}
                  height={720}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  {isRaceFinished ? (
                    <p className="text-2xl font-bold">Corrida Finalizada</p>
                  ) : (
                    <p className="text-2xl font-bold">Transmissão ao Vivo</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

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
                    {raceStatus?.lapsCompleted ?? 0}/
                    {raceStatus?.totalLaps ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Tempo Decorrido
                  </p>
                  <p className="text-2xl font-bold">
                    {raceStatus?.timeElapsed ?? "00:00:00"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Líder</p>
                  <p className="text-2xl font-bold">
                    {lapData.length > 0
                      ? lapData[lapData.length - 1].leader
                      : "N/A"}
                  </p>
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
                      value={selectedDriver.id.toString()}
                      onValueChange={(value) =>
                        setSelectedDriver(
                          drivers.find((d) => d.id === parseInt(value)) ||
                            drivers[0]
                        )
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Selecione um piloto" />
                      </SelectTrigger>
                      <SelectContent>
                        {drivers.map((driver) => (
                          <SelectItem
                            key={driver.id}
                            value={driver.id.toString()}
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
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Battery className="w-4 h-4" />
                        <span>Bateria</span>
                      </div>
                      <span className="font-bold">
                        {selectedDriverData.battery}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2.5">
                      <div
                        className="bg-primary h-2.5 rounded-full"
                        style={{ width: `${selectedDriverData.battery}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4" />
                        <span>Velocidade</span>
                      </div>
                      <span className="font-bold">
                        {selectedDriverData.speed} km/h
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
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        <span>Energia Usada</span>
                      </div>
                      <span className="font-bold">
                        {selectedDriverData.energy} kWh
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

          <Dialog open={showRaceDetails} onOpenChange={setShowRaceDetails}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Detalhes da Corrida</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart className="w-5 h-5" />
                      Tendências de Apostas
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
                      Desempenho do Piloto
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={driverPerformance}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="name" />
                        <PolarRadiusAxis angle={30} domain={[0, 250]} />
                        <Radar
                          name="Velocidade Média"
                          dataKey="averageSpeed"
                          stroke="#8884d8"
                          fill="#8884d8"
                          fillOpacity={0.6}
                        />
                        <Radar
                          name="Consistência"
                          dataKey="consistency"
                          stroke="#82ca9d"
                          fill="#82ca9d"
                          fillOpacity={0.6}
                        />
                        <Radar
                          name="Racecraft"
                          dataKey="racecraft"
                          stroke="#ffc658"
                          fill="#ffc658"
                          fillOpacity={0.6}
                        />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
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
                        data={energyManagement}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="energyUsed"
                          fill="#8884d8"
                          name="Energia Usada (kWh)"
                        />
                        <Bar
                          dataKey="regeneration"
                          fill="#82ca9d"
                          name="Energia Regenerada (kWh)"
                        />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Análise de Ultrapassagens
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
                        <Bar
                          dataKey="overtakes"
                          fill="#8884d8"
                          name="Ultrapassagens"
                        />
                        <Bar
                          dataKey="defensiveActions"
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
                    {lapData.length > 0 &&
                      lapData[lapData.length - 1].drivers.map((driver) => (
                        <Popover key={driver.name}>
                          <PopoverTrigger asChild>
                            <div className="flex items-center justify-between py-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50">
                              <div className="flex items-center gap-3">
                                <div className="font-bold text-lg w-8">
                                  {driver.position}
                                </div>
                                <Avatar className="w-10 h-10">
                                  <AvatarImage
                                    src={
                                      drivers.find(
                                        (d) => d.name === driver.name
                                      )?.avatar
                                    }
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
                                    {
                                      drivers.find(
                                        (d) => d.name === driver.name
                                      )?.team
                                    }
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
                                  {
                                    drivers.find((d) => d.name === driver.name)
                                      ?.team
                                  }
                                </p>
                              </div>
                              <div className="grid gap-2">
                                {Object.entries(
                                  getDriverStats(driver.name)
                                ).map(([key, value]) => (
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
                          <AvatarImage
                            src={message.avatar}
                            alt={message.user}
                          />
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Fazer uma Aposta</span>
                <DollarSign className="w-5 h-5 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold mb-4">
                Seus Pontos: {userPoints}
              </p>
              <Tabs defaultValue="regular" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="regular">Apostas Regulares</TabsTrigger>
                  <TabsTrigger value="nextLap">
                    Apostas na Próxima Volta
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="regular">
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="betType" className="text-right">
                        Tipo de Aposta
                      </label>
                      <Select
                        value={betType}
                        onValueChange={(value) => setBetType(value)}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Selecione o tipo de aposta" />
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
                        Piloto
                      </label>
                      <Select
                        value={betDriver}
                        onValueChange={(value) => setBetDriver(value)}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Selecione o piloto" />
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
                        Quantidade
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
                    {betType && betDriver && betAmount && (
                      <div className="text-right">
                        <p>
                          Ganho Potencial:{" "}
                          {(Number(betAmount) * betMultiplier || 0).toFixed(2)}{" "}
                          pontos
                        </p>
                        <p>Multiplicador: {betMultiplier.toFixed(2)}x</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="nextLap">
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="betType" className="text-right">
                        Tipo de Aposta
                      </label>
                      <Select
                        value={betType}
                        onValueChange={(value) =>
                          setBetType(
                            `nextLap${
                              value.charAt(0).toUpperCase() + value.slice(1)
                            }`
                          )
                        }
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Selecione o tipo de aposta" />
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
                      <label htmlFor="betDriver" className="text-right">
                        Piloto
                      </label>
                      <Select
                        value={betDriver}
                        onValueChange={(value) => setBetDriver(value)}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Selecione o piloto" />
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
                        Quantidade
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
                    {betType && betDriver && betAmount && (
                      <div className="text-right">
                        <p>
                          Ganho Potencial:{" "}
                          {(Number(betAmount) * betMultiplier || 0).toFixed(2)}{" "}
                          pontos
                        </p>
                        <p>Multiplicador: {betMultiplier.toFixed(2)}x</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
              <Button
                onClick={handlePlaceBet}
                disabled={
                  !betType ||
                  !betDriver ||
                  !betAmount ||
                  Number(betAmount) <= 0 ||
                  Number(betAmount) > userPoints ||
                  isRaceFinished
                }
                className="w-full mt-4"
              >
                Fazer Aposta
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <RaceDashboard />

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
