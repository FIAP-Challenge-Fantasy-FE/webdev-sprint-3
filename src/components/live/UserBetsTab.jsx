import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { DollarSign } from "lucide-react"
import { motion } from 'framer-motion'

export default function UserBetsTab({ userBets }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold flex items-center space-x-2 text-primary dark:text-primary-light">
            <DollarSign className="w-6 h-6" />
            <span>Your Bets</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {userBets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No bets placed yet
              </div>
            ) : (
              userBets.map((bet) => (
                <div
                  key={bet.id}
                  className="flex items-center justify-between py-3 border-b last:border-b-0 dark:border-gray-700"
                >
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{bet.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {bet.driver}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{bet.amount} points</p>
                    <Badge
                      variant={bet.status === "won" ? "success" : bet.status === "lost" ? "destructive" : "outline"}
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
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  )
}