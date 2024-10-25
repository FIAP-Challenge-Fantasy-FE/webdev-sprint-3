import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DollarSign } from "lucide-react"

export default function UserBetsTab({ userBets }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Your Bets
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
                <p className="font-semibold">{bet.amount} points</p>
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
  )
}