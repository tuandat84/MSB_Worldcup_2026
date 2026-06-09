"use client"

import { useState, useEffect, useRef } from "react"
import {
  Trophy,
  Target,
  CheckCircle2,
  TrendingUp,
  Mail,
  CalendarDays,
  User,
  AtSign,
  Edit2,
  Camera,
  Check,
  X
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  MAX_AVATAR_FILE_SIZE,
  isAllowedImageType,
  resizeAvatarImage,
} from "@/lib/resize-image"

type ProfileStats = {
  totalPoints: number
  totalPredictions: number
  exactScores: number
  rank: number
}

function getInitials(name: string) {
  if (!name) return "WC"
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase()
}

export function Profile({
  user,
  onUserUpdate
}: {
  user: any
  onUserUpdate: (updatedUser: any) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [fullname, setFullname] = useState(user.fullname || "")
  const [nickname, setNickname] = useState(user.nickname || "")
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar || null)
  
  const [stats, setStats] = useState<ProfileStats>({
    totalPoints: 0,
    totalPredictions: 0,
    exactScores: 0,
    rank: 0
  })
  
  const [loading, setLoading] = useState(false)
  const [resizingAvatar, setResizingAvatar] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch stats from leaderboard
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/users/leaderboard")
        if (res.ok) {
          const data = await res.json()
          const players = data.leaderboard
          const myIndex = players.findIndex((p: any) => p.id === user.id)
          
          if (myIndex !== -1) {
            const me = players[myIndex]
            setStats({
              totalPoints: me.totalPoints,
              totalPredictions: me.totalPredictions,
              exactScores: me.correctPredictions,
              rank: myIndex + 1
            })
          } else {
            // Trường hợp người dùng mới chưa có trong bảng xếp hạng
            setStats({
              totalPoints: 0,
              totalPredictions: 0,
              exactScores: 0,
              rank: players.length + 1
            })
          }
        }
      } catch (err) {
        console.error("Lỗi lấy thống kê cá nhân:", err)
      }
    }
    
    fetchStats()
  }, [user.id])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setErrorMsg("")

    if (!isAllowedImageType(file)) {
      setErrorMsg("Chỉ chấp nhận ảnh JPG, PNG, WebP hoặc GIF.")
      e.target.value = ""
      return
    }

    if (file.size > MAX_AVATAR_FILE_SIZE) {
      setErrorMsg("Kích thước ảnh không được vượt quá 5MB!")
      e.target.value = ""
      return
    }

    setResizingAvatar(true)
    try {
      const resized = await resizeAvatarImage(file)
      setAvatarBase64(resized)
      setAvatarPreview(resized)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Không thể xử lý ảnh")
      e.target.value = ""
    } finally {
      setResizingAvatar(false)
    }
  }

  // Gửi cập nhật thông tin
  async function handleSave() {
    if (!fullname.trim() || !nickname.trim()) {
      setErrorMsg("Tên đầy đủ và biệt danh không được để trống!")
      return
    }

    setLoading(true)
    setErrorMsg("")
    setSuccessMsg("")

    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullname,
          nickname,
          avatar: avatarBase64 // Có thể là null nếu không thay đổi
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra")

      setSuccessMsg("Cập nhật thông tin thành công!")
      onUserUpdate(data.user)
      setIsEditing(false)
      setAvatarBase64(null)
      
      setTimeout(() => setSuccessMsg(""), 3000)
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleCancel() {
    setFullname(user.fullname || "")
    setNickname(user.nickname || "")
    setAvatarPreview(user.avatar || null)
    setAvatarBase64(null)
    setIsEditing(false)
    setErrorMsg("")
  }

  // Định dạng ngày tham gia
  const joinedDateStr = user.created_at
    ? new Date(user.created_at).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
    : "Vừa tham gia"

  const statsItems = [
    {
      label: "Tổng điểm",
      value: stats.totalPoints.toLocaleString("vi-VN"),
      icon: Trophy,
      accent: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    },
    {
      label: "Số trận đã dự đoán",
      value: stats.totalPredictions,
      icon: Target,
      accent: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
    },
    {
      label: "Đúng tỷ số (+3 đ)",
      value: stats.exactScores,
      icon: CheckCircle2,
      accent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
    },
    {
      label: "Thứ hạng hiện tại",
      value: `#${stats.rank}`,
      icon: TrendingUp,
      accent: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    },
  ]

  return (
    <div className="mx-auto w-full max-w-5xl p-0 sm:p-2">
      {successMsg && (
        <div className="mb-4 rounded-lg bg-emerald-100 p-3 text-sm font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm font-medium text-red-700 dark:bg-red-500/15 dark:text-red-400">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Cột trái: avatar + tên */}
        <Card className="md:col-span-1">
          <CardContent className="flex flex-col items-center gap-4 p-4 text-center sm:p-6">
            <div className="relative group">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={user.fullname}
                  className="size-24 rounded-full object-cover ring-4 ring-primary/20"
                />
              ) : (
                <div
                  className="flex size-24 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground"
                  aria-hidden="true"
                >
                  {getInitials(user.fullname)}
                </div>
              )}
              
              {isEditing && (
                <button
                  type="button"
                  onClick={() => !resizingAvatar && fileInputRef.current?.click()}
                  disabled={resizingAvatar}
                  className="absolute inset-0 flex items-center justify-center bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-wait"
                  title="Thay đổi ảnh đại diện"
                >
                  {resizingAvatar ? (
                    <span className="text-xs font-medium">Đang xử lý...</span>
                  ) : (
                    <Camera className="size-5" />
                  )}
                </button>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
            />

            {isEditing && (
              <p className="text-xs text-muted-foreground">
                Tối đa 5MB · Tự động resize về 512px
              </p>
            )}

            <div className="space-y-1">
              <h1 className="text-balance text-xl font-bold tracking-tight text-card-foreground">
                {user.fullname}
              </h1>
              <p className="inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="size-4" aria-hidden="true" />
                {user.email}
              </p>
            </div>

            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 mt-2"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="size-3.5" />
                Chỉnh sửa hồ sơ
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Cột phải: thông tin chi tiết */}
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="mb-4 flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base font-semibold text-card-foreground">
                  Thông tin cá nhân
                </h2>
                {isEditing && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      <X className="size-3.5" /> Hủy
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 gap-1"
                      onClick={handleSave}
                      disabled={loading}
                    >
                      <Check className="size-3.5" /> {loading ? "Đang lưu..." : "Lưu"}
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-1 border-b border-border pb-3 sm:grid-cols-3 sm:items-center sm:gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="size-4 shrink-0" aria-hidden="true" />
                    <span>Tên đầy đủ</span>
                  </div>
                  <div className="text-sm font-semibold break-words text-card-foreground sm:col-span-2">
                    {isEditing ? (
                      <Input
                        value={fullname}
                        onChange={(e) => setFullname(e.target.value)}
                        className="h-9 w-full"
                      />
                    ) : (
                      user.fullname
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-1 border-b border-border pb-3 sm:grid-cols-3 sm:items-center sm:gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AtSign className="size-4 shrink-0" aria-hidden="true" />
                    <span>Nickname</span>
                  </div>
                  <div className="text-sm font-semibold break-words text-card-foreground sm:col-span-2">
                    {isEditing ? (
                      <Input
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="h-9 w-full"
                      />
                    ) : (
                      `@${user.nickname}`
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-1 border-b border-border pb-3 sm:grid-cols-3 sm:items-center sm:gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="size-4 shrink-0" aria-hidden="true" />
                    <span>Email</span>
                  </div>
                  <div className="text-sm font-semibold break-all text-muted-foreground sm:col-span-2">
                    {user.email}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-1 sm:grid-cols-3 sm:items-center sm:gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
                    <span>Ngày tham gia</span>
                  </div>
                  <div className="text-sm font-semibold text-card-foreground sm:col-span-2">
                    {joinedDateStr}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <h2 className="mb-3 text-base font-semibold text-foreground">Thống kê thành tích</h2>
            <div className="grid grid-cols-2 gap-4">
              {statsItems.map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <span
                      className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${stat.accent}`}
                    >
                      <stat.icon className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xl font-bold tabular-nums text-card-foreground">
                        {stat.value}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
