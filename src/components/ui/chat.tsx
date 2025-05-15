import * as React from "react"
import { Button } from "./button"
import { cn } from "@/lib/utils"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  error?: string
}

export function Chat({ className }: { className?: string }) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = { role: "user", content: input }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai-function-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: input }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get AI response')
      }

      if (data.result.text) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: data.result.text
        }])
      } else if (data.result.functionResponse) {
        const { output, error } = data.result.functionResponse.response
        setMessages(prev => [...prev, {
          role: "assistant",
          content: output || 'Function executed successfully',
          error: error
        }])
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        error: error instanceof Error ? error.message : 'Unknown error'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col h-[400px] w-full max-w-md border rounded-lg", className)}>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, i) => (
          <div
            key={i}
            className={cn(
              "flex w-max max-w-[80%] rounded-lg px-3 py-2",
              message.role === "user"
                ? "ml-auto bg-primary text-primary-foreground"
                : message.error 
                  ? "bg-destructive/10 text-destructive"
                  : "bg-muted"
            )}
          >
            {message.error ? (
              <div>
                <div>{message.content}</div>
                <div className="text-xs mt-1 text-destructive">{message.error}</div>
              </div>
            ) : (
              message.content
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={isLoading}
        />
        <Button type="submit" size="sm" disabled={isLoading}>
          {isLoading ? "..." : "Send"}
        </Button>
      </form>
    </div>
  )
}