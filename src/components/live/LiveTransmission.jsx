import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { motion } from 'framer-motion'
import YouTube from "react-youtube"
import { Users, Clock, Flag } from "lucide-react"

export default function LiveTransmission({ raceTitle, raceSubtitle, viewerCount, isLive, duration, lapsCompleted, totalLaps, timeElapsed }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="overflow-hidden"
    >
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}> {/* 16:9 Aspect Ratio */}
        <div className="absolute top-0 left-0 w-full h-full bg-black flex items-center justify-center">
          <YouTube
            videoId="efq9LKuelIo"
            className="w-full h-full"
            opts={{
              width: '100%',
              height: '100%',
              playerVars: {
                autoplay: 1,
                controls: 0,
                loop: 1,
                mute: 1,
              }
            }}
          />
        </div>
        {isLive && (
          <Badge 
            variant="destructive" 
            className="absolute top-4 left-4 text-sm font-semibold"
          >
            LIVE
          </Badge>
        )}
      </div>
      <div className="p-4 bg-gray-100 dark:bg-gray-800">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between space-y-2 md:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {raceTitle}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {raceSubtitle}
            </p>
          </div>
          <div className="flex items-start space-x-4 text-xs md:text-base">
            <div className="flex items-center space-x-2">
              <Flag className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">Laps</p>
                <p className="font-bold text-gray-900 dark:text-gray-100">{lapsCompleted}/{totalLaps}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">Time Elapsed</p>
                <p className="font-bold text-gray-900 dark:text-gray-100">{timeElapsed}</p>
              </div>
            </div>
          </div>
        </div>
        <Separator className="my-4" />
        <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <Users size={16} />
            <span>{viewerCount.toLocaleString()} viewers</span>
          </div>
          {duration && (
            <div className="flex items-center space-x-2">
              <Clock size={16} />
              <span>{duration}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
