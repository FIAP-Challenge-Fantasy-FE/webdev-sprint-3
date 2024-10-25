import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRace } from '@/contexts/RaceContext'
import { useUser } from '@/hooks/useUser'
import { useBetting } from '@/hooks/useBetting'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { DollarSign } from "lucide-react"
import BettingForm from './BettingForm'
import { useMediaQuery } from '@/hooks/use-media-query'


export default function BettingCard({ isRaceFinished, onPlaceBet, setShowLoginDialog }) {
  const { betOptions, nextLapBetOptions, drivers } = useRace()
  const { userProfile } = useUser()
  const { calculateBetMultiplier } = useBetting()
  const [openBetting, setOpenBetting] = useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const handlePlaceBet = async (betType, betDriver, betAmount, betMultiplier) => {
    if (!userProfile) {
      setShowLoginDialog(true)
      return
    }
    try {
      await onPlaceBet(betType, betDriver, betAmount, betMultiplier)
      setOpenBetting(false)
    } catch (error) {
      console.error("Error placing bet:", error)
      // TODO: Show error message to user
    }
  }

  const BettingDialog = isDesktop ? Dialog : Drawer

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-2xl font-bold text-primary dark:text-primary-light">
            <span>Betting</span>
            <DollarSign className="w-6 h-6" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BettingDialog open={openBetting} onOpenChange={setOpenBetting}>
            <DialogTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={() => setOpenBetting(true)} 
                  className="w-full bg-primary hover:bg-primary/90 text-white" 
                  disabled={isRaceFinished}
                >
                  Open Betting
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Place Your Bet</DialogTitle>
                <DialogDescription>
                  Choose your bet type, driver, and amount.
                </DialogDescription>
              </DialogHeader>
              <BettingForm
                betOptions={betOptions}
                nextLapBetOptions={nextLapBetOptions}
                drivers={drivers}
                userPoints={userProfile?.points || 0}
                onPlaceBet={handlePlaceBet}
                calculateBetMultiplier={calculateBetMultiplier}
              />
            </DialogContent>
          </BettingDialog>
        </CardContent>
      </Card>
    </motion.div>
  )
}