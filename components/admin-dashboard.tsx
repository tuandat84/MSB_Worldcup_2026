"use client"

import { useState, useEffect } from "react"
import {
  Users,
  ListChecks,
  CheckCircle2,
  FileSpreadsheet,
  PlusCircle,
  Save,
  RefreshCw,
  AlertTriangle,
  Lock,
  Unlock,
  Trash2,
  X,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react"
import { formatShortDate } from "@/lib/format-date"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type AdminMatch = {
  id: number
  round: string
  teamA: string
  teamB: string
  kickoff: string
  scoreA: string
  scoreB: string
  status: string
}

type Stats = {
  totalPlayers: number
  totalPredictions: number
  finishedMatches: number
  pendingManual: number
}

type PendingMatch = {
  id: number
  round: string
  teamA: string
  teamB: string
  kickoff: string
}

type AdminPlayer = {
  id: number
  email: string
  fullname: string
  nickname: string
  avatar: string | null
  createdAt: string
  isLocked: boolean
  isHidden: boolean
  totalPredictions: number
}

export function AdminDashboard() {
  const [matches, setMatches] = useState<AdminMatch[]>([])
  const [stats, setStats] = useState<Stats>({
    totalPlayers: 0,
    totalPredictions: 0,
    finishedMatches: 0,
    pendingManual: 0,
  })
  const [pendingManual, setPendingManual] = useState<PendingMatch[]>([])

  // State cho form tạo trận mới
  const [newRound, setNewRound] = useState("")
  const [newTeamA, setNewTeamA] = useState("")
  const [newTeamB, setNewTeamB] = useState("")
  const [newKickoff, setNewKickoff] = useState("")

  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null) // track match ID being updated
  const [formLoading, setFormLoading] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [showPlayersPanel, setShowPlayersPanel] = useState(false)
  const [players, setPlayers] = useState<AdminPlayer[]>([])
  const [playersLoading, setPlayersLoading] = useState(false)
  const [userActionLoading, setUserActionLoading] = useState<number | null>(null)

  const pendingIds = new Set(pendingManual.map((m) => m.id))

  // Fetch dữ liệu
  async function fetchData() {
    try {
      setLoading(true)
      // 1. Fetch matches
      const matchRes = await fetch("/api/matches")
      if (matchRes.ok) {
        const mData = await matchRes.json()
        const formattedMatches = mData.matches.map((m: any) => ({
          id: m.id,
          round: m.round,
          teamA: m.teamA,
          teamB: m.teamB,
          kickoff: m.kickoff,
          scoreA: m.actualScoreA !== null ? m.actualScoreA.toString() : "",
          scoreB: m.actualScoreB !== null ? m.actualScoreB.toString() : "",
          status: m.status
        }))
        setMatches(formattedMatches)
      }

      // 2. Fetch stats
      const statsRes = await fetch("/api/admin/stats")
      if (statsRes.ok) {
        const sData = await statsRes.json()
        setStats(sData.stats)
        setPendingManual(sData.pendingManual ?? [])
      }
    } catch (err) {
      console.error("Lỗi fetch dữ liệu admin:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchPlayers() {
    try {
      setPlayersLoading(true)
      const res = await fetch("/api/admin/users")
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Không thể tải danh sách người chơi")
      }
      const data = await res.json()
      setPlayers(data.players)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Không thể tải danh sách người chơi")
    } finally {
      setPlayersLoading(false)
    }
  }

  async function openPlayersPanel() {
    setShowPlayersPanel(true)
    setErrorMsg("")
    await fetchPlayers()
  }

  async function handleToggleLock(player: AdminPlayer) {
    const nextLocked = !player.isLocked
    const action = nextLocked ? "khóa" : "mở khóa"
    if (!confirm(`${nextLocked ? "Khóa" : "Mở khóa"} tài khoản ${player.nickname}?`)) return

    setUserActionLoading(player.id)
    setErrorMsg("")
    try {
      const res = await fetch(`/api/admin/users/${player.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locked: nextLocked }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Không thể ${action} tài khoản`)
      setPlayers((prev) =>
        prev.map((p) => (p.id === player.id ? { ...p, isLocked: nextLocked } : p))
      )
      setMessage(data.message)
      setTimeout(() => setMessage(""), 3000)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : `Không thể ${action} tài khoản`)
    } finally {
      setUserActionLoading(null)
    }
  }

  async function handleToggleHidden(player: AdminPlayer) {
    const nextHidden = !player.isHidden
    const action = nextHidden ? "ẩn khỏi bảng xếp hạng" : "hiển thị trên bảng xếp hạng"
    if (!confirm(`${nextHidden ? "Ẩn" : "Hiển thị"} ${player.nickname} ${action}?`)) {
      return
    }

    setUserActionLoading(player.id)
    setErrorMsg("")
    try {
      const res = await fetch(`/api/admin/users/${player.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden: nextHidden }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Không thể ${action}`)
      setPlayers((prev) =>
        prev.map((p) => (p.id === player.id ? { ...p, isHidden: nextHidden } : p))
      )
      setMessage(data.message)
      setTimeout(() => setMessage(""), 3000)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : `Không thể ${action}`)
    } finally {
      setUserActionLoading(null)
    }
  }

  async function handleResetPassword(player: AdminPlayer) {
    const newPassword = prompt(
      `Nhập mật khẩu mới cho ${player.fullname} (${player.email}):`
    )
    if (!newPassword) return
    if (newPassword.length < 6) {
      alert("Mật khẩu mới phải có ít nhất 6 ký tự")
      return
    }

    setUserActionLoading(player.id)
    setErrorMsg("")
    try {
      const res = await fetch(`/api/admin/users/${player.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Không thể reset mật khẩu")
      setMessage(data.message)
      setTimeout(() => setMessage(""), 3000)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Không thể reset mật khẩu")
    } finally {
      setUserActionLoading(null)
    }
  }

  async function handleDeletePlayer(player: AdminPlayer) {
    if (
      !confirm(
        `Xóa vĩnh viễn ${player.fullname} (${player.email})? Toàn bộ dự đoán của người này cũng bị xóa.`
      )
    ) {
      return
    }

    setUserActionLoading(player.id)
    setErrorMsg("")
    try {
      const res = await fetch(`/api/admin/users/${player.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Không thể xóa người chơi")
      setPlayers((prev) => prev.filter((p) => p.id !== player.id))
      setStats((prev) => ({
        ...prev,
        totalPlayers: Math.max(0, prev.totalPlayers - 1),
      }))
      setMessage(data.message)
      setTimeout(() => setMessage(""), 3000)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Không thể xóa người chơi")
    } finally {
      setUserActionLoading(null)
    }
  }

  // Cập nhật giá trị nhập tỷ số trong state local
  function updateLocalScore(id: number, field: "scoreA" | "scoreB", value: string) {
    setMatches((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    )
  }

  async function handleSyncNow() {
    setSyncLoading(true)
    setErrorMsg("")
    setMessage("")
    try {
      const res = await fetch("/api/admin/matches/sync", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Đồng bộ thất bại")
      setMessage(data.message || "Đồng bộ thành công!")
      fetchData()
      setTimeout(() => setMessage(""), 4000)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Đồng bộ thất bại")
    } finally {
      setSyncLoading(false)
    }
  }

  async function handleUpdateScore(id: number) {
    const match = matches.find((m) => m.id === id)
    if (!match || match.scoreA === "" || match.scoreB === "") {
      alert("Vui lòng điền đủ tỷ số thực tế!")
      return
    }

    setActionLoading(id)
    setErrorMsg("")
    setMessage("")

    try {
      const res = await fetch(`/api/admin/matches/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scoreA: match.scoreA,
          scoreB: match.scoreB,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra")

      setMessage(`Đã cập nhật kết quả trận đấu ID ${id}!`)
      fetchData() // Tải lại dữ liệu mới nhất
      setTimeout(() => setMessage(""), 3000)
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  // Gửi tạo trận đấu mới lên API
  async function handleCreateMatch(e: React.FormEvent) {
    e.preventDefault()
    if (!newRound || !newTeamA || !newTeamB || !newKickoff) {
      alert("Vui lòng điền đầy đủ thông tin trận đấu mới!")
      return
    }

    setFormLoading(true)
    setErrorMsg("")
    setMessage("")

    try {
      const res = await fetch("/api/admin/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          round: newRound,
          teamA: newTeamA,
          teamB: newTeamB,
          kickoff: newKickoff,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra")

      setMessage("Thêm trận đấu mới thành công!")
      // Reset form
      setNewRound("")
      setNewTeamA("")
      setNewTeamB("")
      setNewKickoff("")

      fetchData()
      setTimeout(() => setMessage(""), 3000)
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  // Xuất bảng xếp hạng ra file CSV (Excel)
  async function handleExportExcel() {
    try {
      const res = await fetch("/api/users/leaderboard")
      if (!res.ok) throw new Error("Không thể tải bảng xếp hạng")
      const data = await res.json()
      const leaderboard = data.leaderboard

      // Tạo chuỗi CSV
      const headers = [
        "Thứ hạng",
        "Họ và tên",
        "Biệt danh",
        "Email",
        "Tổng điểm",
        "Phải đóng (VND)",
        "Dự đoán đúng tỷ số",
        "Tổng số dự đoán",
      ]
      const rows = leaderboard.map((p: any, idx: number) => [
        idx + 1,
        p.name,
        p.nickname,
        p.email || "",
        p.totalPoints,
        p.totalFee ?? 0,
        p.correctPredictions,
        p.totalPredictions,
      ])

      const csvContent = "\uFEFF" + [
        headers.join(","),
        ...rows.map((row: any) => row.map((val: any) => `"${val.toString().replace(/"/g, '""')}"`).join(","))
      ].join("\n")

      // Kích hoạt download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `Bảng_Xếp_Hạng_WorldCup_2026_${Date.now()}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err: any) {
      alert("Lỗi xuất Excel: " + err.message)
    }
  }

  const statsCards = [
    {
      key: "players",
      label: "Tổng số người chơi",
      value: stats.totalPlayers,
      icon: Users,
      accent: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
      clickable: true,
      hint: "Nhấn để xem danh sách & quản lý",
    },
    {
      key: "predictions",
      label: "Tổng số dự đoán",
      value: stats.totalPredictions,
      icon: ListChecks,
      accent: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
      clickable: false,
    },
    {
      key: "finished",
      label: "Trận đã kết thúc",
      value: stats.finishedMatches,
      icon: CheckCircle2,
      accent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
      clickable: false,
    },
  ]

  return (
    <div className="w-full space-y-6 p-0 sm:p-2">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-balance text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Quản trị World Cup 2026
          </h1>
          <p className="text-sm text-muted-foreground">
            Tự động đồng bộ kết quả mỗi 2 giờ (ESPN / API-Football) — hoặc bấm Đồng bộ ngay
          </p>
        </div>
        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <Button
            variant="default"
            className="gap-2 cursor-pointer"
            onClick={handleSyncNow}
            disabled={syncLoading}
          >
            <RefreshCw className={`size-4 ${syncLoading ? "animate-spin" : ""}`} aria-hidden="true" />
            {syncLoading ? "Đang đồng bộ..." : "Đồng bộ ngay"}
          </Button>
          <Button variant="outline" className="gap-2 cursor-pointer" onClick={handleExportExcel}>
            <FileSpreadsheet className="size-4" aria-hidden="true" />
            Export CSV Xếp hạng
          </Button>
        </div>
      </header>

      {stats.pendingManual > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <div className="flex items-start gap-2 font-medium">
            <AlertTriangle className="size-4 mt-0.5 shrink-0" />
            <span>
              {stats.pendingManual} trận chưa tự động cập nhật được — vui lòng nhập tỷ số thủ công bên dưới.
            </span>
          </div>
        </div>
      )}

      {/* Thông báo */}
      {message && (
        <div className="rounded-lg bg-emerald-100 p-3 text-sm font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
          {message}
        </div>
      )}
      {errorMsg && (
        <div className="rounded-lg bg-red-100 p-3 text-sm font-medium text-red-700 dark:bg-red-500/15 dark:text-red-400">
          {errorMsg}
        </div>
      )}

      {/* Stats Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statsCards.map((stat) => (
          <Card
            key={stat.key}
            className={
              stat.clickable
                ? "cursor-pointer transition-shadow hover:shadow-md ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                : undefined
            }
            role={stat.clickable ? "button" : undefined}
            tabIndex={stat.clickable ? 0 : undefined}
            onClick={stat.clickable ? () => openPlayersPanel() : undefined}
            onKeyDown={
              stat.clickable
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      openPlayersPanel()
                    }
                  }
                : undefined
            }
          >
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <span className={`flex size-9 items-center justify-center rounded-lg ${stat.accent}`}>
                <stat.icon className="size-5" aria-hidden="true" />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums text-card-foreground sm:text-3xl">
                {stat.value}
              </p>
              {stat.hint && (
                <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </section>

      {showPlayersPanel && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Users className="size-5 text-primary" />
                Danh sách người tham gia ({players.length})
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Khóa: chặn đăng nhập · Ẩn: không hiện trên BXH · Reset MK: đặt mật khẩu mới cho user.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => setShowPlayersPanel(false)}
              aria-label="Đóng danh sách người chơi"
            >
              <X className="size-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            {playersLoading ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Đang tải danh sách...
              </div>
            ) : players.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Chưa có người chơi nào.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead className="min-w-[140px]">Người chơi</TableHead>
                      <TableHead className="min-w-[180px]">Email</TableHead>
                      <TableHead className="min-w-[90px] text-center">Dự đoán</TableHead>
                      <TableHead className="min-w-[100px]">Trạng thái</TableHead>
                      <TableHead className="min-w-[220px] text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {players.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell>
                          <div className="font-semibold text-sm">{player.fullname}</div>
                          <div className="text-xs text-muted-foreground">@{player.nickname}</div>
                        </TableCell>
                        <TableCell className="text-sm">{player.email}</TableCell>
                        <TableCell className="text-center tabular-nums">
                          {player.totalPredictions}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {player.isLocked ? (
                              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-500/15 dark:text-red-400">
                                <Lock className="size-2.5" />
                                Đã khóa
                              </span>
                            ) : (
                              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                                Hoạt động
                              </span>
                            )}
                            {player.isHidden && (
                              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-500/20 dark:text-slate-300">
                                <EyeOff className="size-2.5" />
                                Ẩn BXH
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-xs"
                              disabled={userActionLoading === player.id}
                              onClick={() => handleToggleLock(player)}
                            >
                              {player.isLocked ? (
                                <>
                                  <Unlock className="size-3 mr-1" />
                                  Mở khóa
                                </>
                              ) : (
                                <>
                                  <Lock className="size-3 mr-1" />
                                  Khóa
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-xs"
                              disabled={userActionLoading === player.id}
                              onClick={() => handleToggleHidden(player)}
                            >
                              {player.isHidden ? (
                                <>
                                  <Eye className="size-3 mr-1" />
                                  Hiện
                                </>
                              ) : (
                                <>
                                  <EyeOff className="size-3 mr-1" />
                                  Ẩn
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-xs"
                              disabled={userActionLoading === player.id}
                              onClick={() => handleResetPassword(player)}
                            >
                              <KeyRound className="size-3 mr-1" />
                              Reset MK
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 px-2 text-xs"
                              disabled={userActionLoading === player.id}
                              onClick={() => handleDeletePlayer(player)}
                            >
                              <Trash2 className="size-3 mr-1" />
                              Xóa
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form thêm trận đấu mới */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <PlusCircle className="size-5 text-primary" />
              Thêm trận đấu mới
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateMatch} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="round">Vòng đấu / Bảng</Label>
                <Input
                  id="round"
                  placeholder="Vòng 16 đội, Tứ kết, Bán kết..."
                  value={newRound}
                  onChange={(e) => setNewRound(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="teamA">Đội nhà (Team A)</Label>
                <Input
                  id="teamA"
                  placeholder="Việt Nam, Pháp, Brazil..."
                  value={newTeamA}
                  onChange={(e) => setNewTeamA(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="teamB">Đội khách (Team B)</Label>
                <Input
                  id="teamB"
                  placeholder="Thái Lan, Đức, Argentina..."
                  value={newTeamB}
                  onChange={(e) => setNewTeamB(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="kickoff">Thời gian khởi tranh</Label>
                <Input
                  id="kickoff"
                  type="datetime-local"
                  value={newKickoff}
                  onChange={(e) => setNewKickoff(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full gap-1.5 mt-2" disabled={formLoading}>
                <PlusCircle className="size-4" />
                {formLoading ? "Đang thêm..." : "Tạo trận đấu"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Danh sách trận đấu cập nhật tỷ số */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              Cập nhật kết quả thủ công (khi tự động thất bại)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {loading ? (
              <div className="text-center py-12 text-sm text-muted-foreground">Đang tải trận đấu...</div>
            ) : matches.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">Chưa có trận đấu nào.</div>
            ) : (
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead className="min-w-[160px]">Cặp đấu</TableHead>
                      <TableHead className="min-w-[120px]">Thời gian</TableHead>
                      <TableHead className="min-w-[120px] text-center">Tỷ số thật</TableHead>
                      <TableHead className="min-w-[100px] text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matches.map((match) => {
                      const formattedTime = formatShortDate(match.kickoff)
                      
                      return (
                        <TableRow key={match.id}>
                          <TableCell className="font-semibold">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm">{match.teamA} vs {match.teamB}</span>
                              <div className="flex gap-1.5 flex-wrap">
                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-secondary text-secondary-foreground">
                                  {match.round}
                                </span>
                                {match.status === "finished" && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                                    <CheckCircle2 className="size-2.5" />
                                    Đã tính điểm
                                  </span>
                                )}
                                {match.status === "locked" && pendingIds.has(match.id) && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                                    <AlertTriangle className="size-2.5" />
                                    Chờ cập nhật
                                  </span>
                                )}
                                {match.status === "locked" && !pendingIds.has(match.id) && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">
                                    Đang đấu
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formattedTime}
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Input
                                type="number"
                                min={0}
                                inputMode="numeric"
                                placeholder="0"
                                value={match.scoreA}
                                onChange={(e) => updateLocalScore(match.id, "scoreA", e.target.value)}
                                className="h-8 w-11 text-center font-bold text-xs p-1"
                                disabled={actionLoading === match.id}
                              />
                              <span className="font-bold text-muted-foreground text-xs" aria-hidden="true">:</span>
                              <Input
                                type="number"
                                min={0}
                                inputMode="numeric"
                                placeholder="0"
                                value={match.scoreB}
                                onChange={(e) => updateLocalScore(match.id, "scoreB", e.target.value)}
                                className="h-8 w-11 text-center font-bold text-xs p-1"
                                disabled={actionLoading === match.id}
                              />
                            </div>
                          </TableCell>
                          
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              className="h-8 text-xs font-semibold px-2.5 cursor-pointer"
                              onClick={() => handleUpdateScore(match.id)}
                              disabled={actionLoading === match.id || match.scoreA === "" || match.scoreB === ""}
                            >
                              <Save className="size-3 mr-1" />
                              {actionLoading === match.id ? "..." : "Lưu"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
