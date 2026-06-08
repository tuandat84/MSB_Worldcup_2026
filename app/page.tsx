"use client"

import { useEffect, useState } from "react"
import { Login } from "@/components/login"
import { Dashboard } from "@/components/dashboard"
import { Loader2 } from "lucide-react"

export default function Page() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Kiểm tra trạng thái phiên đăng nhập
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me")
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        }
      } catch (err) {
        console.error("Check Auth Error:", err)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  function handleLoginSuccess(userData: any) {
    setUser(userData)
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
    } catch (err) {
      console.error("Logout Error:", err)
    }
  }

  function handleUserUpdate(updatedUser: any) {
    setUser(updatedUser)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Đang tải ứng dụng...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <Dashboard 
      user={user} 
      onLogout={handleLogout} 
      onUserUpdate={handleUserUpdate} 
    />
  )
}
