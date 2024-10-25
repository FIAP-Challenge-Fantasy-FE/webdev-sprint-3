import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRace } from "@/contexts/RaceContext"
import { useBetting } from "@/hooks/useBetting"

export default function CompactBettingForm({ onPlaceBet, setShowLoginDialog, isRaceFinished, onCancel }) {
  const [betType, setBetType] = useState("")
  const [betDriver, setBetDriver] = useState("")
  const [betAmount, setBetAmount] = useState("")
  const { drivers } = useRace()
  const { calculateBetMultiplier } = useBetting()

  const handleSubmit = (e) => {
    e.preventDefault()
    onPlaceBet(betType, betDriver, parseInt(betAmount))
  }

  const betMultiplier = calculateBetMultiplier(betType, betDriver)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Place a New Bet</h3>
      <Select value={betType} onValueChange={setBetType}>
        <SelectTrigger>
          <SelectValue placeholder="Select bet type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="winner">Race Winner</SelectItem>
          <SelectItem value="podium">Podium Finish</SelectItem>
          <SelectItem value="fastestLap">Fastest Lap</SelectItem>
          <SelectItem value="topFive">Top 5 Finish</SelectItem>
        </SelectContent>
      </Select>
      
      <Select value={betDriver} onValueChange={setBetDriver}>
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
        placeholder="Bet amount"
        value={betAmount}
        onChange={(e) => setBetAmount(e.target.value)}
      />
      
      {betType && betDriver && betAmount && (
        <div className="text-sm text-muted-foreground">
          <p>Potential Win: {(parseInt(betAmount) * betMultiplier || 0).toFixed(2)} points</p>
          <p>Multiplier: {betMultiplier.toFixed(2)}x</p>
        </div>
      )}
      
      <div className="flex space-x-2 pt-4">
        <Button type="submit" className="flex-1" disabled={isRaceFinished || !betType || !betDriver || !betAmount}>
          Place Bet
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  )
}
