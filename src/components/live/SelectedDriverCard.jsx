import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Battery, Gauge, Zap, ChevronLeft, ChevronRight } from 'lucide-react'

export default function SelectedDriverCard({ selectedDriver, drivers, setSelectedDriver, raceData }) {
  const [isHovered, setIsHovered] = useState(false)

  const selectNextDriver = () => {
    const currentIndex = drivers.findIndex((d) => d.name === selectedDriver.name)
    const nextIndex = (currentIndex + 1) % drivers.length
    setSelectedDriver(drivers[nextIndex])
  }

  const selectPreviousDriver = () => {
    const currentIndex = drivers.findIndex((d) => d.name === selectedDriver.name)
    const previousIndex = (currentIndex - 1 + drivers.length) % drivers.length
    setSelectedDriver(drivers[previousIndex])
  }

  const getDriverData = (driverName) => {
    if (!raceData || !raceData.drivers) return { battery: 0, speed: 0, energy: 0 }
    const driver = raceData.drivers.find((d) => d.name === driverName)
    return driver || { battery: 0, speed: 0, energy: 0 }
  }

  const selectedDriverData = getDriverData(selectedDriver.name)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card 
        className="bg-white dark:bg-gray-800 overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-2xl font-bold text-primary dark:text-primary-light">
            <div className="flex items-center gap-2">
              <Gauge className="w-6 h-6" />
              <span className="truncate max-w-[200px]">{selectedDriver.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={selectPreviousDriver}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </motion.div>
              <Select
                value={selectedDriver.name}
                onValueChange={(value) =>
                  setSelectedDriver(
                    drivers.find((d) => d.name === value) || drivers[0]
                  )
                }
              >
                <SelectTrigger className="w-[140px] sm:w-[180px]">
                  <SelectValue placeholder="Select a driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((driver) => (
                    <SelectItem
                      key={driver.name}
                      value={driver.name}
                    >
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={selectNextDriver}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: `${Math.min(Number(selectedDriverData.battery), 100).toFixed(2)}%` }}
              transition={{ duration: 1, ease: "easeInOut" }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Battery className="w-5 h-5 text-primary dark:text-primary-light" />
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Battery</span>
                </div>
                <span className="font-bold text-gray-800 dark:text-gray-200">
                  {Number(selectedDriverData.battery).toFixed(2)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-primary dark:bg-primary-light h-2.5 rounded-full"
                  style={{ width: `${Math.min(Number(selectedDriverData.battery), 100).toFixed(2)}%` }}
                ></div>
              </div>
            </motion.div>
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: `${Math.min((selectedDriverData.speed / 250) * 100, 100)}%` }}
              transition={{ duration: 1, ease: "easeInOut" }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-primary dark:text-primary-light" />
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Speed</span>
                </div>
                <span className="font-bold text-gray-800 dark:text-gray-200">
                  {Number(selectedDriverData.speed).toFixed(2)} km/h
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-primary dark:bg-primary-light h-2.5 rounded-full"
                  style={{ width: `${Math.min((selectedDriverData.speed / 250) * 100, 100)}%` }}
                ></div>
              </div>
            </motion.div>
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: `${Math.min((selectedDriverData.energy / 30) * 100, 100)}%` }}
              transition={{ duration: 1, ease: "easeInOut" }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary dark:text-primary-light" />
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Energy Used</span>
                </div>
                <span className="font-bold text-gray-800 dark:text-gray-200">
                  {Number(selectedDriverData.energy).toFixed(2)} kWh
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-primary dark:bg-primary-light h-2.5 rounded-full"
                  style={{ width: `${Math.min((selectedDriverData.energy / 30) * 100, 100)}%` }}
                ></div>
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}