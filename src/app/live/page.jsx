"use client";

import { useState, useEffect, useCallback } from "react";
import { useRace } from "@/contexts/RaceContext";
import { useRaceViewers } from "@/hooks/useRaceViewers";
import { useUser } from "@/hooks/useUser";
import { useBetting } from "@/hooks/useBetting";
import { useToastContext } from "@/contexts/ToastContext";
import { useMediaQuery } from "@/hooks/use-media-query";
import LiveTransmission from "@/components/live/LiveTransmission";
import RaceStatusCard from "@/components/live/RaceStatus";
import SelectedDriverCard from "@/components/live/SelectedDriverCard";
import BettingCard from "@/components/live/BettingCard";
import RaceDashboard from "@/components/live/RaceDashboard";
import Sidebar from "@/components/live/Sidebar";
import LoginDialog from "@/components/live/LoginDialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

export default function LivePage() {
  const { raceData, drivers, isRaceFinished, isLoading, error } = useRace();
  const { user, loading: userLoading } = useUser();
  const { userBets, placeBet } = useBetting();
  const { showToast } = useToastContext();
  const [selectedDriver, setSelectedDriver] = useState(drivers[0] || null);
  const [showRaceDetails, setShowRaceDetails] = useState(false);
  const [showFinalDashboard, setShowFinalDashboard] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [pendingBet, setPendingBet] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const viewerCount = useRaceViewers(raceData?.id);

  useEffect(() => {
    if (error) {
      showToast("An error occurred while loading race data", "error", {
        label: "Retry",
        onClick: () => window.location.reload(),
      });
    }
  }, [error, showToast]);

  const handlePlaceBet = useCallback(
    async (betType, betDriver, betAmount, betMultiplier) => {
      if (!user) {
        setPendingBet({ betType, betDriver, betAmount, betMultiplier });
        setShowLoginDialog(true);
        return;
      }
      try {
        await placeBet(betType, betDriver, betAmount, betMultiplier);
        showToast("Bet placed successfully", "success");
      } catch (error) {
        showToast("Failed to place bet. Please try again.", "error");
      }
    },
    [user, placeBet, showToast]
  );

  const handleLoginSuccess = useCallback(() => {
    if (pendingBet) {
      handlePlaceBet(
        pendingBet.betType,
        pendingBet.betDriver,
        pendingBet.betAmount,
        pendingBet.betMultiplier
      );
      setPendingBet(null);
    }
  }, [pendingBet, handlePlaceBet]);

  const handleSendMessage = useCallback(
    (message) => {
      // TODO: Implement actual message sending logic
      const newMessage = {
        id: Date.now().toString(),
        user: user?.displayName || "Anonymous",
        message,
        avatar: user?.photoURL || "",
        timestamp: new Date(),
      };
      setChatMessages((prevMessages) => [...prevMessages, newMessage]);
    },
    [user]
  );

  if (isLoading || userLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!raceData) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-lg text-gray-600">No race data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <LiveTransmission
            raceTitle={raceData.name || "Formula E: Monaco E-Prix"}
            raceSubtitle={`Round ${raceData.round || "N/A"} - ${
              raceData.circuit || "Circuit"
            }`}
            viewerCount={viewerCount}
            isLive={!isRaceFinished}
            duration={raceData.duration || "01:30:00"}
          />
          <RaceStatusCard raceData={raceData} />
          {!isDesktop && (
            <BettingCard
              isRaceFinished={isRaceFinished}
              onPlaceBet={handlePlaceBet}
              setShowLoginDialog={setShowLoginDialog}
            />
          )}
          {selectedDriver && (
            <SelectedDriverCard
              selectedDriver={selectedDriver}
              drivers={drivers}
              setSelectedDriver={setSelectedDriver}
              raceData={raceData}
            />
          )}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            {isRaceFinished ? (
              <Button
                onClick={() => setShowFinalDashboard(true)}
                className="w-full bg-primary hover:bg-primary/90 text-white"
              >
                View Race Dashboard
              </Button>
            ) : (
              <Button
                onClick={() => setShowRaceDetails(true)}
                className="w-full bg-primary hover:bg-primary/90 text-white"
              >
                View More Race Details
              </Button>
            )}
          </motion.div>
        </div>
        <Sidebar
          raceData={raceData}
          chatMessages={chatMessages}
          userBets={userBets}
          isDesktop={isDesktop}
          onPlaceBet={handlePlaceBet}
          setShowLoginDialog={setShowLoginDialog}
          onSendMessage={handleSendMessage}
          isUserLoggedIn={!!user}
          isRaceFinished={isRaceFinished}
        />
      </div>
      <RaceDashboard
        showFinalDashboard={showFinalDashboard}
        setShowFinalDashboard={setShowFinalDashboard}
        showRaceDetails={showRaceDetails}
        setShowRaceDetails={setShowRaceDetails}
        raceData={raceData}
      />
      <LoginDialog
        showLoginDialog={showLoginDialog}
        setShowLoginDialog={setShowLoginDialog}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
