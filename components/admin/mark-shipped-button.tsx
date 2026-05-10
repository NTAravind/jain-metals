"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Truck, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface MarkShippedButtonProps {
  orderId: string
  phone: string
  isShipped: boolean
}

export function MarkShippedButton({ orderId, phone, isShipped }: MarkShippedButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleMarkShipped = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/messages/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, phone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to mark as shipped")
      toast.success("Order marked as shipped")
      window.location.reload()
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleMarkShipped}
      disabled={isShipped || loading}
      variant={isShipped ? "outline" : "default"}
      className={`gap-2 ${isShipped ? "border-green-500 text-green-600 hover:bg-green-50" : "bg-black text-white hover:bg-gray-800"}`}
    >
      {loading ? (
        <span className="animate-spin">⟳</span>
      ) : isShipped ? (
        <CheckCircle className="w-4 h-4" />
      ) : (
        <Truck className="w-4 h-4" />
      )}
      {isShipped ? "Shipped" : "Mark as Shipped"}
    </Button>
  )
}