"use client"

import { useState, useEffect } from "react"
import {
  Trophy,
  Medal,
  Award,
  LayoutDashboard,
  Target,
  ListOrdered,
  User,
  Menu,
  X,
  CalendarClock,
  Bell,
  ChevronRight,
  Settings,
  LogOut,
  ShieldAlert,
  ScrollText,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Import subcomponents
import { MatchList } from "@/components/match-list"
import { Leaderboard } from "@/components/leaderboard"
import { Profile } from "@/components/profile"
import { AdminDashboard } from "@/components/admin-dashboard"
import { UserPredictions } from "@/components/user-predictions"
import { MatchDetailView } from "@/components/match-detail"
import { RulesPage } from "@/components/rules"
import { TeamFlag } from "@/components/team-flag"
import { getTeamViName } from "@/lib/team-data"
import { formatShortDate } from "@/lib/format-date"
// import { formatVnd } from "@/lib/pool-fee"

type NavItem = {
  key: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

type TopPlayer = {
  id: number
  rank: number
  name: string
  totalPoints: number
}

type UpcomingMatch = {
  id: number
  round: string
  teamA: string
  teamB: string
  kickoff: string
}

function getInitials(name: string) {
  if (!name) return "WC"
  const parts = name.trim().split(" ")
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  const first = parts[0]?.[0] ?? ""
  const last = parts[parts.length - 1]?.[0] ?? ""
  return (first + last).toUpperCase()
}

function rankBadge(rank: number) {
  switch (rank) {
    case 1:
      return { badge: "bg-amber-400 text-amber-950", icon: <Trophy className="size-4" aria-hidden="true" /> }
    case 2:
      return { badge: "bg-slate-300 text-slate-900", icon: <Medal className="size-4" aria-hidden="true" /> }
    case 3:
      return { badge: "bg-orange-400 text-orange-950", icon: <Award className="size-4" aria-hidden="true" /> }
    default:
      return { badge: "bg-muted text-muted-foreground", icon: null }
  }
}

export function Dashboard({
  user,
  onLogout,
  onUserUpdate,
}: {
  user: any
  onLogout: () => Promise<void>
  onUserUpdate: (updatedUser: any) => void
}) {
  const [activeNav, setActiveNav] = useState("dashboard")
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null)
  const [userDetailSource, setUserDetailSource] = useState<"leaderboard" | "dashboard">("leaderboard")
  const [matchDetailSource, setMatchDetailSource] = useState<"predict" | "dashboard">("predict")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([])
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([])
  const [loading, setLoading] = useState(true)

  // Load menu items
  const navItems: NavItem[] = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "predict", label: "Dự đoán", icon: Target },
    { key: "leaderboard", label: "Bảng xếp hạng", icon: ListOrdered },
    { key: "rules", label: "Thể lệ", icon: ScrollText },
    { key: "profile", label: "Profile", icon: User },
  ]

  // Thêm menu Admin nếu user là admin
  if (user.role === "admin") {
    navItems.push({ key: "admin", label: "Quản trị", icon: ShieldAlert })
  }

  // Gọi API lấy dữ liệu trang chủ
  useEffect(() => {
    async function fetchHomeData() {
      try {
        setLoading(true)
        // Top 3 điểm cao nhất
        const lbRes = await fetch("/api/users/leaderboard")
        if (lbRes.ok) {
          const lbData = await lbRes.json()
          const formattedPlayers = lbData.leaderboard
            .slice(0, 3)
            .map((p: { id: number; name: string; totalPoints: number }, idx: number) => ({
              id: p.id,
              rank: idx + 1,
              name: p.name,
              totalPoints: p.totalPoints,
            }))
          setTopPlayers(formattedPlayers)
        }

        // 2. Fetch matches (filter upcoming/open)
        const matchRes = await fetch("/api/matches")
        if (matchRes.ok) {
          const mData = await matchRes.json()
          // Lọc các trận chưa diễn ra (open hoặc status = open/upcoming)
          const upcoming = mData.matches
            .filter((m: any) => m.status === "open")
            .slice(0, 4)
            .map((m: any) => {
              const formattedTime = formatShortDate(m.kickoff)
              return {
                id: m.id,
                round: m.round,
                teamA: m.teamA,
                teamB: m.teamB,
                kickoff: formattedTime
              }
            })
          setUpcomingMatches(upcoming)
        }
      } catch (err) {
        console.error("Lỗi fetch dashboard stats:", err)
      } finally {
        setLoading(false)
      }
    }

    if (activeNav === "dashboard") {
      fetchHomeData()
    }
  }, [activeNav])

  // Hàm render view theo activeNav
  function renderView() {
    switch (activeNav) {
      case "dashboard":
        return renderDashboardContent()
      case "predict":
        return (
          <MatchList
            onMatchClick={(matchId) => {
              setSelectedMatchId(matchId)
              setMatchDetailSource("predict")
              setActiveNav("match-detail")
            }}
          />
        )
      case "match-detail":
        return selectedMatchId ? (
          <MatchDetailView
            matchId={selectedMatchId}
            onBack={() => {
              setSelectedMatchId(null)
              setActiveNav(matchDetailSource)
            }}
          />
        ) : (
          <MatchList
            onMatchClick={(matchId) => {
              setSelectedMatchId(matchId)
              setMatchDetailSource("predict")
              setActiveNav("match-detail")
            }}
          />
        )
      case "leaderboard":
        return (
          <Leaderboard
            onUserClick={(player) => {
              setUserDetailSource("leaderboard")
              setSelectedUserId(player.id)
              setActiveNav("user-detail")
            }}
          />
        )
      case "user-detail":
        return selectedUserId ? (
          <UserPredictions
            userId={selectedUserId}
            onBack={() => {
              setSelectedUserId(null)
              setActiveNav(userDetailSource)
            }}
          />
        ) : (
          <Leaderboard
            onUserClick={(player) => {
              setUserDetailSource("leaderboard")
              setSelectedUserId(player.id)
              setActiveNav("user-detail")
            }}
          />
        )
      case "rules":
        return <RulesPage />
      case "profile":
        return <Profile user={user} onUserUpdate={onUserUpdate} />
      case "admin":
        return <AdminDashboard />
      default:
        return renderDashboardContent()
    }
  }

  function renderDashboardContent() {
    const nextMatch = upcomingMatches[0]

    return (
      <>
        {nextMatch && !loading && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 sm:mb-6 sm:px-4 dark:border-amber-500/20 dark:bg-amber-500/10">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-400 text-amber-950 sm:size-9">
              <Bell className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-snug text-amber-900 dark:text-amber-300">
                Trận {getTeamViName(nextMatch.teamA)} vs {getTeamViName(nextMatch.teamB)} sắp bắt đầu
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-amber-700 dark:text-amber-400/80">
                {nextMatch.round} · {nextMatch.kickoff} · Hãy hoàn tất dự đoán
              </p>
            </div>
          </div>
        )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top 3 điểm cao nhất */}
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <header className="flex flex-col gap-2 border-b border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
              <Trophy className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              Top 3 bảng xếp hạng
            </h2>
            <button
              type="button"
              onClick={() => setActiveNav("leaderboard")}
              className="inline-flex items-center self-start text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:self-auto"
            >
              Xem bảng xếp hạng
              <ChevronRight className="size-3.5" aria-hidden="true" />
            </button>
          </header>
          <ul className="divide-y divide-border">
            {loading ? (
              <p className="p-4 text-sm text-muted-foreground">Đang tải...</p>
            ) : topPlayers.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Chưa có dữ liệu xếp hạng.</p>
            ) : (
              topPlayers.map((player) => {
                const { badge, icon } = rankBadge(player.rank)
                return (
                  <li key={player.rank} className="flex items-center gap-2 px-3 py-3 transition-colors hover:bg-muted/60 sm:gap-3 sm:px-4">
                    <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${badge}`}>
                      {icon ?? player.rank}
                    </span>
                    <span
                      className="hidden size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground sm:flex"
                      aria-hidden="true"
                    >
                      {getInitials(player.name)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setUserDetailSource("dashboard")
                        setSelectedUserId(player.id)
                        setActiveNav("user-detail")
                      }}
                      className="min-w-0 flex-1 truncate text-left text-sm font-medium text-card-foreground transition-colors hover:text-primary hover:underline"
                    >
                      {player.name}
                    </button>
                    <span className="shrink-0 text-sm font-bold tabular-nums text-amber-700 dark:text-amber-400">
                      {player.totalPoints} điểm
                    </span>
                  </li>
                )
              })
            )}
          </ul>
        </section>

        {/* Upcoming matches */}
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <header className="flex flex-col gap-2 border-b border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
              <CalendarClock className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              Trận mở dự đoán ({upcomingMatches.length})
            </h2>
            <button
              type="button"
              onClick={() => setActiveNav("predict")}
              className="inline-flex items-center self-start text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:self-auto"
            >
              Dự đoán ngay
              <ChevronRight className="size-3.5" aria-hidden="true" />
            </button>
          </header>
          <ul className="divide-y divide-border">
            {loading ? (
              <p className="p-4 text-sm text-muted-foreground">Đang tải...</p>
            ) : upcomingMatches.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Không có trận đấu nào đang mở dự đoán.</p>
            ) : (
              upcomingMatches.map((match) => (
                <li key={match.id} className="flex flex-col gap-2 px-3 py-3 transition-colors hover:bg-muted/60 sm:flex-row sm:items-center sm:gap-3 sm:px-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <TeamFlag team={match.teamA} size="sm" />
                      <span className="text-xs text-muted-foreground">vs</span>
                      <TeamFlag team={match.teamB} size="sm" />
                    </div>
                    <p className="text-xs text-muted-foreground">{match.round}</p>
                  </div>
                  <div className="flex w-full items-center justify-between gap-2 border-t border-border pt-2 sm:w-auto sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                    <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-semibold tabular-nums text-secondary-foreground">
                      <CalendarClock className="size-3 shrink-0" aria-hidden="true" />
                      {match.kickoff}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMatchId(match.id)
                        setMatchDetailSource("dashboard")
                        setActiveNav("match-detail")
                      }}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
      </>
    )
  }

  function handleNavClick(key: string) {
    setSelectedUserId(null)
    setSelectedMatchId(null)
    setActiveNav(key)
    setSidebarOpen(false)
  }

  const mobileNavItems = navItems.filter((item) => item.key !== "admin")

  return (
    <div className="min-h-svh overflow-x-hidden bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur">
        <div className="flex h-14 min-w-0 items-center justify-between gap-2 px-3 sm:h-16 sm:gap-3 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted md:hidden"
              aria-label="Mở menu"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
            <div
              className="flex min-w-0 cursor-pointer items-center gap-2 sm:gap-2.5"
              onClick={() => setActiveNav("dashboard")}
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground sm:size-9">
                <Trophy className="size-4 sm:size-5" aria-hidden="true" />
              </div>
              <span className="truncate text-sm font-bold tracking-tight text-foreground sm:text-lg">
                <span className="sm:hidden">MSB WC 2026</span>
                <span className="hidden sm:inline">MSB Data WorldCup 2026</span>
              </span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-0.5 outline-none transition-colors hover:bg-muted">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.fullname}
                  className="size-9 rounded-full object-cover ring-2 ring-border"
                />
              ) : (
                <span
                  className="flex size-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground ring-2 ring-border"
                  aria-hidden="true"
                >
                  {getInitials(user.fullname)}
                </span>
              )}
              <span className="hidden pr-2 text-sm font-medium text-foreground sm:inline">{user.fullname}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setActiveNav("profile")}>
                <User className="size-4" aria-hidden="true" />
                Hồ sơ
              </DropdownMenuItem>
              {user.role === "admin" && (
                <DropdownMenuItem onClick={() => setActiveNav("admin")}>
                  <ShieldAlert className="size-4 text-amber-500" aria-hidden="true" />
                  Trang quản trị
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onLogout}>
                <LogOut className="size-4" aria-hidden="true" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - desktop */}
        <aside className="sticky top-16 hidden h-[calc(100svh-4rem)] w-60 shrink-0 border-r border-border bg-card p-4 md:block">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavButton
                key={item.key}
                item={item}
                active={
                  activeNav === item.key ||
                  (item.key === "leaderboard" && activeNav === "user-detail") ||
                  (item.key === "predict" && activeNav === "match-detail")
                }
                onClick={() => {
                  setSelectedUserId(null)
                  setSelectedMatchId(null)
                  setActiveNav(item.key)
                }}
              />
            ))}
          </nav>
        </aside>

        {/* Sidebar - mobile drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
            <aside className="absolute left-0 top-0 h-full w-64 border-r border-border bg-card p-4 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Menu</span>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="inline-flex size-8 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted"
                  aria-label="Đóng menu"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <NavButton
                    key={item.key}
                    item={item}
                    active={
                      activeNav === item.key ||
                      (item.key === "leaderboard" && activeNav === "user-detail") ||
                      (item.key === "predict" && activeNav === "match-detail")
                    }
                    onClick={() => {
                      setSelectedUserId(null)
                      setSelectedMatchId(null)
                      setActiveNav(item.key)
                      setSidebarOpen(false)
                    }}
                  />
                ))}
              </nav>
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="w-full min-w-0 flex-1 overflow-x-hidden px-3 py-4 pb-20 sm:px-6 sm:py-6 md:pb-6 lg:px-8">
          <div className="mx-auto w-full max-w-5xl">
            {activeNav === "dashboard" && (
              <div className="mb-4 sm:mb-6">
                <h1 className="text-balance text-lg font-bold tracking-tight text-foreground break-words sm:text-xl md:text-2xl">
                  Chào mừng, {user.nickname || user.fullname}!
                </h1>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  {user.role === "admin" ? "Quản trị viên" : "Thành viên"} · Tổng quan hôm nay
                </p>
              </div>
            )}

            {renderView()}
          </div>
        </main>
      </div>

      {/* Bottom nav — mobile */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur md:hidden"
        aria-label="Điều hướng chính"
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around gap-0.5 px-0.5 pb-[env(safe-area-inset-bottom)]">
          {mobileNavItems.map((item) => {
            const Icon = item.icon
            const active =
              activeNav === item.key ||
              (item.key === "leaderboard" && activeNav === "user-detail") ||
              (item.key === "predict" && activeNav === "match-detail")
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleNavClick(item.key)}
                className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 px-0.5 py-2 text-[9px] font-medium transition-colors sm:text-[10px] ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                <span className="max-w-full truncate">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

function NavButton({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const Icon = item.icon
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors w-full text-left ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="size-4 shrink-0" />
      {item.label}
    </button>
  )
}
