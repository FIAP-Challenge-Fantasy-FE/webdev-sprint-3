import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { motion } from 'framer-motion'
import { Trophy, Loader2 } from "lucide-react"


export default function Leaderboard({ drivers, isLoading = false }) {
  const [openPopoverId, setOpenPopoverId] = useState(null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold flex items-center space-x-2 text-primary dark:text-primary-light">
            <Trophy className="w-6 h-6" />
            <span>Live Leaderboard</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !drivers || drivers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No driver data available
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Pos</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((driver) => (
                    <Popover
                      key={driver.name}
                      open={openPopoverId === driver.name}
                      onOpenChange={(open) => setOpenPopoverId(open ? driver.name : null)}
                    >
                      <PopoverTrigger asChild>
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setOpenPopoverId(driver.name)}
                        >
                          <TableCell className="font-medium">
                            {driver.position <= 3 ? (
                              <Badge variant={driver.position === 1 ? "default" : driver.position === 2 ? "secondary" : "outline"}>
                                {driver.position}
                              </Badge>
                            ) : (
                              driver.position
                            )}
                          </TableCell>
                          <TableCell>{driver.name}</TableCell>
                          <TableCell>{driver.team}</TableCell>
                          <TableCell className="text-right">{driver.points}</TableCell>
                        </TableRow>
                      </PopoverTrigger>
                      <PopoverContent className="w-80" align="start">
                        <div className="grid gap-4">
                          <div className="space-y-2">
                            <h4 className="font-medium leading-none">{driver.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {driver.team}
                            </p>
                          </div>
                          <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Position:</span>
                              <span className="font-medium">{driver.position}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Points:</span>
                              <span className="font-medium">{driver.points}</span>
                            </div>
                            {driver.lapTime && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Last Lap:</span>
                                <span className="font-medium">{driver.lapTime}</span>
                              </div>
                            )}
                            {driver.speed && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Speed:</span>
                                <span className="font-medium">{driver.speed} km/h</span>
                              </div>
                            )}
                            {driver.energy && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Energy:</span>
                                <span className="font-medium">{driver.energy}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}