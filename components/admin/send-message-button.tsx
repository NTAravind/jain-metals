"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { MessageCircle } from "lucide-react"

export function SendMessageButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      })
      if (!res.ok) throw new Error("Failed to send message")
      toast.success("Message sent to customer")
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleSend}
      disabled={loading}
      className="gap-2"
    >
      <MessageCircle className="w-4 h-4" />
      {loading ? "Sending..." : "Send Message"}
    </Button>
  )
}
