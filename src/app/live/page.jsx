"use client";

import { useState, useEffect } from "react";
import { useRace } from "@/contexts/RaceContext";
import { useRaceViewers } from "@/hooks/useRaceViewers";
import { useUser } from "@/hooks/useUser";
import { useBetting } from "@/hooks/useBetting";
import { useToastContext } from "@/contexts/ToastContext";
import { useMediaQuery } from "@/hooks/use-media-query";
import LiveTransmission from "@/components/live/LiveTransmission";
import Sidebar from "@/components/live/Sidebar";
import LoginDialog from "@/components/live/LoginDialog";
import RaceDashboard from "@/components/live/RaceDashboard";
import { Button } from "@/components/ui/button";
import { Loader2, DollarSign, Plus } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ChatTab from "@/components/live/ChatTab";
import UserBetsTab from "@/components/live/UserBetsTab";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import CompactBettingForm from "@/components/live/CompactBettingForm";
import DraggableWidgets from "@/components/live/DraggableWidgets";

export default function LivePage() {
  const { raceData, drivers, isRaceFinished, isLoading, error } = useRace()
  const { user, loading: userLoading } = useUser()
  const { userBets, placeBet, calculateBetMultiplier } = useBetting()
  const { showToast } = useToastContext()
  const [selectedDriver, setSelectedDriver] = useState(() => {
    return drivers && drivers.length > 0 ? drivers[0] : null
  })
  const [showFinalDashboard, setShowFinalDashboard] = useState(false)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [pendingBet, setPendingBet] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const isMobile = useMediaQuery("(max-width: 768px)")
  const viewerCount = useRaceViewers(raceData?.id)
  const [showBettingDrawer, setShowBettingDrawer] = useState(false)
  const [showBettingForm, setShowBettingForm] = useState(false);

  useEffect(() => {
    if (drivers && drivers.length > 0 && !selectedDriver) {
      setSelectedDriver(drivers[0])
    }
  }, [drivers, selectedDriver])

  useEffect(() => {
    if (error) {
      showToast('An error occurred while loading race data', 'error', {
        label: 'Retry',
        onClick: () => window.location.reload()
      })
    }
  }, [error, showToast])

  const handlePlaceBet = async (betType, betDriver, betAmount) => {
    if (!user) {
      setShowLoginDialog(true);
      setPendingBet({ betType, betDriver, betAmount });
      return;
    }
    try {
      const betMultiplier = calculateBetMultiplier(betType, betDriver);
      await placeBet(betType, betDriver, betAmount, betMultiplier);
      showToast('Bet placed successfully', 'success');
      setShowBettingForm(false);
      setShowBettingDrawer(false);
    } catch (error) {
      showToast('Failed to place bet. Please try again.', 'error');
    }
  };

  const handleLoginSuccess = () => {
    if (pendingBet) {
      handlePlaceBet(pendingBet.betType, pendingBet.betDriver, pendingBet.betAmount)
      setPendingBet(null)
    }
  }

  const handleSendMessage = (message) => {
    const newMessage = {
      id: Date.now().toString(),
      user: user?.displayName || 'Anonymous',
      message,
      avatar: user?.photoURL || '',
      timestamp: new Date()
    }
    setChatMessages(prevMessages => [...prevMessages, newMessage])
  }

  const getDrawerHeight = () => {
    if (showBettingForm) return 'h-auto';
    if (userBets.length === 0) return 'h-[30vh]';
    if (userBets.length <= 3) return 'h-[50vh]';
    return 'h-[80vh]';
  };

  if (isLoading || userLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!raceData) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-lg text-gray-600">No race data available.</p>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <div className="flex-grow overflow-y-auto scrollbar-hide">
        <LiveTransmission
          raceTitle={raceData.name || "Formula E: Monaco E-Prix"}
          raceSubtitle={`Round ${raceData.round || 'N/A'} - ${raceData.circuit || 'Circuit'}`}
          viewerCount={viewerCount}
          isLive={!isRaceFinished}
          lapsCompleted={raceData.raceStatus?.lapsCompleted || 0}
          totalLaps={raceData.raceStatus?.totalLaps || 0}
          timeElapsed={raceData.raceStatus?.timeElapsed || "00:00:00"}
        />
        {isMobile ? (
          <div className="overflow-y-auto scrollbar-hide">
            <Tabs defaultValue="leaderboard" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                <TabsTrigger value="widgets">Widgets</TabsTrigger>
                <TabsTrigger value="chat">Chat</TabsTrigger>
              </TabsList>
              <TabsContent value="leaderboard" className="scrollbar-hide">
                <Sidebar
                  raceData={raceData}
                  chatMessages={chatMessages}
                  userBets={userBets}
                  isDesktop={false}
                  onPlaceBet={handlePlaceBet}
                  setShowLoginDialog={setShowLoginDialog}
                  onSendMessage={handleSendMessage}
                  isUserLoggedIn={!!user}
                  isRaceFinished={isRaceFinished}
                />
              </TabsContent>
              <TabsContent value="widgets" className="scrollbar-hide">
                <div className="p-4 space-y-4">
                  <DraggableWidgets
                    selectedDriver={selectedDriver}
                    drivers={drivers}
                    setSelectedDriver={setSelectedDriver}
                    raceData={raceData}
                    isRaceFinished={isRaceFinished}
                    setShowFinalDashboard={setShowFinalDashboard}
                  />
                </div>
              </TabsContent>
              <TabsContent value="chat" className="scrollbar-hide">
                <div className="p-4">
                  <ChatTab
                    chatMessages={chatMessages}
                    onSendMessage={handleSendMessage}
                    isUserLoggedIn={!!user}
                    setShowLoginDialog={setShowLoginDialog}
                  />
                </div>
              </TabsContent>
            </Tabs>
            <Drawer open={showBettingDrawer} onOpenChange={setShowBettingDrawer}>
              <DrawerTrigger asChild>
                <Button
                  className="fixed bottom-4 right-4 rounded-full shadow-lg z-50"
                  size="icon"
                  onClick={() => setShowBettingDrawer(true)}
                >
                  <DollarSign className="h-6 w-6" />
                </Button>
              </DrawerTrigger>
              <DrawerContent className={`${getDrawerHeight()} max-h-[80vh]`}>
                <div className="p-4 h-full flex flex-col">
                  {showBettingForm ? (
                    <CompactBettingForm
                      onPlaceBet={handlePlaceBet}
                      setShowLoginDialog={setShowLoginDialog}
                      isRaceFinished={isRaceFinished}
                      drivers={drivers}
                      onCancel={() => setShowBettingForm(false)}
                    />
                  ) : (
                    <>
                      <div className="flex-1 overflow-y-auto">
                        <UserBetsTab 
                          userBets={userBets} 
                          isRaceFinished={isRaceFinished}
                        />
                      </div>
                      <Button
                        className="mt-4 w-full mb-4"
                        onClick={() => setShowBettingForm(true)}
                        disabled={isRaceFinished}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Place New Bet
                      </Button>
                    </>
                  )}
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        ) : (
          <div className="p-4 overflow-y-auto scrollbar-hide">
            <DraggableWidgets
              selectedDriver={selectedDriver}
              drivers={drivers}
              setSelectedDriver={setSelectedDriver}
              raceData={raceData}
              isRaceFinished={isRaceFinished}
              setShowFinalDashboard={setShowFinalDashboard}
            />
          </div>
        )}
      </div>
      
      {/* Sidebar for desktop */}
      {!isMobile && (
        <div className="w-80 overflow-y-auto scrollbar-hide">
          <Sidebar
            raceData={raceData}
            chatMessages={chatMessages}
            userBets={userBets}
            isDesktop={true}
            onPlaceBet={handlePlaceBet}
            setShowLoginDialog={setShowLoginDialog}
            onSendMessage={handleSendMessage}
            isUserLoggedIn={!!user}
            isRaceFinished={isRaceFinished}
          />
        </div>
      )}

      {/* Race Dashboard Modal */}
      <RaceDashboard
        showFinalDashboard={showFinalDashboard}
        setShowFinalDashboard={setShowFinalDashboard}
        raceData={raceData}
      />

      {/* Login Dialog */}
      <LoginDialog
        showLoginDialog={showLoginDialog}
        setShowLoginDialog={setShowLoginDialog}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  )
}
