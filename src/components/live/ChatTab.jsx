import { useState } from 'react'
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
      className="h-full flex flex-col"
    >
      <div className="flex items-center space-x-2 mb-4">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Chat da Corrida</h2>
      </div>
      <ScrollArea className="flex-grow mb-4">
        {chatMessages.map((message) => (
          <div
            key={message.id}
            className="flex items-start space-x-3 mb-4"
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={message.avatar} alt={message.user} />
              <AvatarFallback>{message.user[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{message.user}</p>
              <p className="text-sm text-muted-foreground">{message.message}</p>
            </div>
          </div>
        ))}
      </ScrollArea>
      <form
        onSubmit={handleSendMessage}
        className="flex gap-2 mt-auto"
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
    </motion.div>
  )
}
