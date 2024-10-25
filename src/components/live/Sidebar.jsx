import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import LeaderboardTab from './Leaderboard'
import ChatTab from './Chat'
import UserBetsTab from './UserBet'
import BettingCard from './BettingCard'

export default function Sidebar({
  raceData,
  chatMessages,
  userBets,
  isDesktop,
  onPlaceBet,
  setShowLoginDialog,
  onSendMessage,
  isUserLoggedIn,
  isRaceFinished
}) {
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Tabs defaultValue="leaderboard" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="chat">Race Chat</TabsTrigger>
          <TabsTrigger value="bets">Your Bets</TabsTrigger>
        </TabsList>
        <TabsContent value="leaderboard">
          <LeaderboardTab raceData={raceData} />
        </TabsContent>
        <TabsContent value="chat">
          <ChatTab
            chatMessages={chatMessages}
            onSendMessage={onSendMessage}
            isUserLoggedIn={isUserLoggedIn}
            setShowLoginDialog={setShowLoginDialog}
          />
        </TabsContent>
        <TabsContent value="bets">
          <UserBetsTab userBets={userBets} />
        </TabsContent>
      </Tabs>
      {isDesktop && (
        <BettingCard
          isRaceFinished={isRaceFinished}
          onPlaceBet={onPlaceBet}
          setShowLoginDialog={setShowLoginDialog}
        />
      )}
    </motion.div>
  )
}