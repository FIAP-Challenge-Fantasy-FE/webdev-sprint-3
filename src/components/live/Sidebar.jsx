import { useState } from 'react'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import Leaderboard from './Leaderboard'
import ChatTab from './ChatTab'
import { PlusCircle } from 'lucide-react'

export default function Sidebar({
  raceData,
  chatMessages,
  isDesktop,
  setShowLoginDialog,
  onSendMessage,
  isUserLoggedIn,
  isRaceFinished,
}) {
  return (
    <motion.div
      className={`h-full flex flex-col bg-gray-100 dark:bg-gray-800 ${
        isDesktop ? 'w-80' : 'w-full'
      }`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {isDesktop ? (
        <Tabs defaultValue="leaderboard" className="flex-grow flex flex-col h-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-200 dark:bg-gray-700">
            <TabsTrigger value="leaderboard" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">Leaderboard</TabsTrigger>
            <TabsTrigger value="chat" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">Race Chat</TabsTrigger>
          </TabsList>
          <ScrollArea className="flex-grow">
            <TabsContent value="leaderboard" className="m-0 p-4">
              <Leaderboard drivers={raceData?.drivers} isLoading={!raceData} />
            </TabsContent>
            <TabsContent value="chat" className="m-0 p-4 h-full flex flex-col">
              <ChatTab
                chatMessages={chatMessages}
                onSendMessage={onSendMessage}
                isUserLoggedIn={isUserLoggedIn}
                setShowLoginDialog={setShowLoginDialog}
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      ) : (
        <ScrollArea className="flex-grow">
          <div className="p-4">
            <Leaderboard drivers={raceData?.drivers} isLoading={!raceData} />
          </div>
        </ScrollArea>
      )}
    </motion.div>
  )
}
