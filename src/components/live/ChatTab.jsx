import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, MessageSquare } from "lucide-react"
import { motion } from 'framer-motion'


export default function ChatTab({ chatMessages, onSendMessage, isUserLoggedIn, setShowLoginDialog }) {
  const [newMessage, setNewMessage] = useState('')

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!isUserLoggedIn) {
      setShowLoginDialog(true)
      return
    }
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim())
      setNewMessage('')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold flex items-center space-x-2 text-primary dark:text-primary-light">
            <MessageSquare className="w-6 h-6" />
            <span>Race Chat</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] mb-4">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className="flex items-start space-x-4 mb-4"
              >
                <Avatar>
                  <AvatarImage src={message.avatar} alt={message.user} />
                  <AvatarFallback>{message.user[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{message.user}</p>
                  <p className="text-gray-600 dark:text-gray-400">{message.message}</p>
                </div>
              </div>
            ))}
          </ScrollArea>
          <form
            onSubmit={handleSendMessage}
            className="flex gap-2"
          >
            <Input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-grow"
            />
            <Button type="submit" size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}