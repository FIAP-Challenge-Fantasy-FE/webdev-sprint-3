import { Badge } from "@/components/ui/badge"
import { DollarSign } from "lucide-react"
import { motion } from 'framer-motion'

export default function UserBetsTab({ userBets, isRaceFinished }) {
  return (
    <div className="overflow-y-auto scrollbar-hide">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col"
      >
        <div className="flex items-center space-x-2 mb-4">
          <DollarSign className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Suas Apostas</h2>
        </div>
        {userBets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma aposta realizada ainda
          </div>
        ) : (
          userBets.map((bet) => (
            <div
              key={bet.id}
              className="flex items-center justify-between py-3 px-2 border-b last:border-b-0 dark:border-gray-700"
            >
              <div>
                <p className="font-semibold text-sm">{bet.type}</p>
                <p className="text-xs text-muted-foreground">
                  {bet.driver}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm">{bet.amount} pontos</p>
                <Badge
                  variant={bet.status === "won" ? "success" : bet.status === "lost" ? "destructive" : "outline"}
                  className="text-xs"
                >
                  {bet.status === "pending"
                    ? `${bet.multiplier}x`
                    : bet.status === "won"
                    ? `+${bet.points}`
                    : bet.status === "lost"
                    ? `-${bet.amount}`
                    : ""}
                </Badge>
              </div>
            </div>
          ))
        )}
      </motion.div>
    </div>
  )
}
