import { Card, CardContent } from "@/components/ui/card"
import { motion } from 'framer-motion'
import YouTube from "react-youtube"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function LiveTransmission({ raceTitle, raceSubtitle, viewerCount, isLive }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="aspect-video bg-gray-900 relative">
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
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                {raceTitle}
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {viewerCount.toLocaleString()} viewers
              </span>
            </div>
            <Separator className="my-2" />
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {raceSubtitle}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}