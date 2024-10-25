import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, ArrowLeft, DollarSign } from 'lucide-react'
import UserBetsTab from './UserBetsTab'
import CompactBettingForm from './CompactBettingForm'
import { useBetting } from '@/hooks/useBetting'
import { useRace } from '@/contexts/RaceContext'
import { useUser } from '@/hooks/useUser'
import { useToastContext } from '@/contexts/ToastContext'
import { motion } from 'framer-motion'

export default function UserBetsWidget({ isRaceFinished }) {
  const [showBettingForm, setShowBettingForm] = useState(false)
  const { userBets, placeBet, calculateBetMultiplier } = useBetting()
  const { drivers } = useRace()
  const { user } = useUser()
  const { showToast } = useToastContext()
  

  const handlePlaceBet = async (betType, betDriver, betAmount) => {
    if (!user) {
      showToast('Please log in to place a bet', 'error')
      return
    }
    try {
      const betMultiplier = calculateBetMultiplier(betType, betDriver)
      await placeBet(betType, betDriver, betAmount, betMultiplier)
      showToast('Bet placed successfully', 'success')
      setShowBettingForm(false)
    } catch (error) {
      showToast('Failed to place bet. Please try again.', 'error')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full flex flex-col"
    >
      <div className="overflow-y-auto scrollbar-hide">
        <Card className="bg-white dark:bg-gray-800 flex flex-col h-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-2xl font-bold text-primary dark:text-primary-light">
              <span className="flex items-center">
                <DollarSign className="w-6 h-6 mr-2" />
                {showBettingForm ? 'Place a New Bet' : 'Your Bets'}
              </span>
              {!showBettingForm ? (
                <Button
                  size="sm"
                  onClick={() => setShowBettingForm(true)}
                  disabled={isRaceFinished}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Bet
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowBettingForm(false)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {showBettingForm ? (
              <CompactBettingForm
                onPlaceBet={handlePlaceBet}
                isRaceFinished={isRaceFinished}
                drivers={drivers}
                onCancel={() => setShowBettingForm(false)}
              />
            ) : (
              <UserBetsTab
                userBets={userBets}
                isRaceFinished={isRaceFinished}
                compact={true}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
