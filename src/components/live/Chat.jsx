import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"

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
    <Card>
      <CardHeader>
        <CardTitle>Race Chat</CardTitle>
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
                <p className="font-semibold">{message.user}</p>
                <p>{message.message}</p>
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
  )
}