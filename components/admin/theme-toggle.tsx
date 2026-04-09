"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const isDark = theme === "dark"

  return (
    <Button
      variant="ghost"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-full justify-start gap-3 h-10 px-3 hover:bg-gray-100 rounded-lg text-gray-600"
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        <Sun className={`h-4 w-4 transition-all ${isDark ? "opacity-0 scale-75" : "opacity-100 scale-100"}`} />
        <Moon className={`absolute h-4 w-4 transition-all ${isDark ? "opacity-100 scale-100" : "opacity-0 scale-75"}`} />
      </div>
      <span className="text-xs font-medium">
        {isDark ? "Dark" : "Light"} Mode
      </span>
    </Button>
  )
}
