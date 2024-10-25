import { useState, useEffect, useRef, useCallback } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Loader2, Info } from "lucide-react"
import confetti from 'canvas-confetti'

// Helper function to format numbers
const formatNumber = (num) => {
  if (typeof num === 'number') {
    return num.toFixed(2);
  }
  return num;
};

export default function Leaderboard({ drivers, isLoading = false }) {
  const [openPopoverId, setOpenPopoverId] = useState(null)
  const [hoveredRow, setHoveredRow] = useState(null)
  const [sortedDrivers, setSortedDrivers] = useState([])
  const prevTopThree = useRef([])
  const isInitialRender = useRef(true)

  const checkTopThreeChanges = useCallback((currentTopThree) => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      prevTopThree.current = currentTopThree;
      return;
    }

    const newTopThree = currentTopThree.filter(name => !prevTopThree.current.includes(name));

    if (newTopThree.length > 0) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    prevTopThree.current = currentTopThree;
  }, []);

  useEffect(() => {
    if (drivers && drivers.length > 0) {
      const sorted = [...drivers].sort((a, b) => a.position - b.position);
      setSortedDrivers(sorted);

      const currentTopThree = sorted.slice(0, 3).map(d => d.name);
      checkTopThreeChanges(currentTopThree);
    }
  }, [drivers, checkTopThreeChanges]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center space-x-2 p-4">
        <Trophy className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Live Leaderboard</h2>
      </div>
      {isLoading ? (
        <div className="flex-grow flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !sortedDrivers || sortedDrivers.length === 0 ? (
        <div className="flex-grow flex justify-center items-center text-muted-foreground">
          No driver data available
        </div>
      ) : (
        <ScrollArea className="flex-grow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Pos</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead className="text-right">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {sortedDrivers.map((driver) => (
                  <Popover
                    key={driver.name}
                    open={openPopoverId === driver.name}
                    onOpenChange={(open) => setOpenPopoverId(open ? driver.name : null)}
                  >
                    <PopoverTrigger asChild>
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        layout
                        className={`cursor-pointer transition-colors duration-200 ${
                          hoveredRow === driver.name ? 'bg-muted/80' : 'hover:bg-muted/50'
                        }`}
                        onMouseEnter={() => setHoveredRow(driver.name)}
                        onMouseLeave={() => setHoveredRow(null)}
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
                        <TableCell className="text-right">
                          {formatNumber(driver.points)}
                          {hoveredRow === driver.name && (
                            <Info className="inline-block ml-2 w-4 h-4 text-muted-foreground" />
                          )}
                        </TableCell>
                      </motion.tr>
                    </PopoverTrigger>
                    <PopoverContent className="w-64" align="start">
                      <div className="grid gap-2">
                        <div className="space-y-1">
                          <h4 className="font-medium leading-none">{driver.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {driver.team}
                          </p>
                        </div>
                        <div className="grid gap-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Position:</span>
                            <span className="font-medium">{driver.position}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Points:</span>
                            <span className="font-medium">{formatNumber(driver.points)}</span>
                          </div>
                          {driver.lapTime && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Last Lap:</span>
                              <span className="font-medium">{formatNumber(driver.lapTime)}</span>
                            </div>
                          )}
                          {driver.speed && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Speed:</span>
                              <span className="font-medium">{formatNumber(driver.speed)} km/h</span>
                            </div>
                          )}
                          {driver.energy && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Energy:</span>
                              <span className="font-medium">{formatNumber(driver.energy)}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </ScrollArea>
      )}
    </div>
  )
}
