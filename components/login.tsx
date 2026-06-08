"use client"

import type React from "react"
import Image from "next/image"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export function Login({ onLoginSuccess }: { onLoginSuccess: (user: any) => void }) {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullname, setFullname] = useState("")
  const [nickname, setNickname] = useState("")
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      if (isRegister) {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, fullname, nickname }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra")

        setSuccess("Đăng ký thành công! Vui lòng đăng nhập.")
        setIsRegister(false)
        setPassword("")
      } else {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra")

        onLoginSuccess(data.user)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg sm:p-8">
        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center">
            <Image
              src="/msb-logo.svg"
              alt="Ngân hàng MSB"
              width={194}
              height={46}
              className="h-11 w-auto object-contain sm:h-12"
              priority
            />
          </div>
          <h1 className="text-xl font-bold text-card-foreground text-balance sm:text-2xl">
            MSB Data WorldCup 2026
          </h1>
          <p className="mt-2 text-base font-semibold text-primary">
            {isRegister ? "Đăng ký tài khoản" : "Đăng nhập"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isRegister
              ? "Đăng ký để tham gia dự đoán tỷ số World Cup 2026"
              : "Chào mừng bạn quay lại MSB Data WorldCup 2026"}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm font-medium text-red-700 dark:bg-red-500/15 dark:text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg bg-emerald-100 p-3 text-sm font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {isRegister && (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="fullname">Họ và tên</Label>
                <Input
                  id="fullname"
                  type="text"
                  placeholder="Nguyễn Văn An"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="nickname">Biệt danh / Nickname</Label>
                <Input
                  id="nickname"
                  type="text"
                  placeholder="an_predictor"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="ban@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {!isRegister && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(checked) => setRemember(checked === true)}
                />
                <Label htmlFor="remember" className="cursor-pointer text-sm font-normal text-muted-foreground">
                  Ghi nhớ đăng nhập
                </Label>
              </div>

              <span className="text-sm font-medium text-primary">
                Quên mật khẩu?
              </span>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Đang xử lý..." : isRegister ? "Đăng ký" : "Đăng nhập"}
          </Button>

          <div className="text-center mt-2">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister)
                setError("")
                setSuccess("")
              }}
              className="text-sm font-medium text-primary hover:underline"
            >
              {isRegister ? "Đã có tài khoản? Đăng nhập ngay" : "Chưa có tài khoản? Đăng ký ngay"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
