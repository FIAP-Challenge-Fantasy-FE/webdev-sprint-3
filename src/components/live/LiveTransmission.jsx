import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { motion } from 'framer-motion'
import YouTube from "react-youtube"
import { Users, Clock } from "lucide-react"

export default function LiveTransmission({ raceTitle, raceSubtitle, viewerCount, isLive, duration }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden bg-white dark:bg-gray-800">
        <CardContent className="p-0">
          <div className="aspect-video bg-gray-100 dark:bg-gray-900 relative">
            <YouTube
              videoId="efq9LKuelIo"
              className="w-full h-full object-cover"
              opts={{
                width: "100%",
                height: "100%",
                playerVars: {
                  autoplay: 1,
                  controls: 0,
                  loop: 1,
                  mute: 1,
                }
              }}
            />
            {isLive && (
              <Badge 
                variant="destructive" 
                className="absolute top-4 left-4 text-sm font-semibold"
              >
                LIVE
              </Badge>
            )}
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {raceTitle}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {raceSubtitle}
              </p>
            </div>
            <Separator />
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
        </CardContent>
      </Card>
    </motion.div>
  )
}