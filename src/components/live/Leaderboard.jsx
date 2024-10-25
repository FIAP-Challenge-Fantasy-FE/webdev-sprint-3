import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Flag } from "lucide-react"

export default function LeaderboardTab({ raceData }) {
  const getDriverStats = (driverName) => {
    if (!raceData || !raceData.drivers) return {}
    const driver = raceData.drivers.find((d) => d.name === driverName)
    if (!driver) return {}

    const { performance, energyManagement, overtakingData } = driver
    return { ...performance, ...energyManagement, ...overtakingData }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="w-5 h-5" />
          Live Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {raceData?.drivers.map((driver) => (
            <Popover key={driver.name}>
              <PopoverTrigger asChild>
                <div className="flex items-center justify-between py-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="font-bold text-lg w-8">
                      {driver.position}
                    </div>
                    <Avatar className="w-10 h-10">
                      <AvatarImage
                        src={driver.avatar}
                        alt={driver.name}
                      />
                      <AvatarFallback>
                        {driver.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">
                        {driver.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {driver.team}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {driver.lapTime}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Last Lap
                    </div>
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">
                      {driver.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {driver.team}
                    </p>
                  </div>
                  <div className="grid gap-2">
                    {Object.entries(getDriverStats(driver.name)).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="grid grid-cols-2 items-center gap-4"
                        >
                          <span className="text-sm">
                            {key.charAt(0).toUpperCase() +
                              key.slice(1)}
                          </span>
                          <span className="font-medium">
                            {typeof value === "number"
                              ? value.toFixed(2)
                              : value}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}