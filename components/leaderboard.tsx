"use client"

import { useState, useEffect, useMemo } from "react"
import { Trophy, Medal, Award, Target, Wallet, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatVnd } from "@/lib/pool-fee"

type Player = {
  id: number
  name: string
  nickname: string
  avatar: string | null
  totalPoints: number
  correctPredictions: number
  totalPredictions: number
  totalFee: number
}

type SortKey = "points" | "fee"

function getInitials(name: string) {
  if (!name) return "WC"
  const parts = name.trim().split(" ")
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  const first = parts[0]?.[0] ?? ""
  const last = parts[parts.length - 1]?.[0] ?? ""
  return (first + last).toUpperCase()
}

function rankStyles(rank: number) {
  switch (rank) {
    case 1:
      return {
        row: "bg-amber-50 hover:bg-amber-100/80 dark:bg-amber-500/10 dark:hover:bg-amber-500/20",
        badge: "bg-amber-400 text-amber-950",
        ring: "ring-amber-400",
        icon: <Trophy className="size-4" aria-hidden="true" />,
      }
    case 2:
      return {
        row: "bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-400/10 dark:hover:bg-slate-400/20",
        badge: "bg-slate-300 text-slate-900",
        ring: "ring-slate-300",
        icon: <Medal className="size-4" aria-hidden="true" />,
      }
    case 3:
      return {
        row: "bg-orange-50 hover:bg-orange-100/80 dark:bg-orange-700/10 dark:hover:bg-orange-700/20",
        badge: "bg-orange-400 text-orange-950",
        ring: "ring-orange-400",
        icon: <Award className="size-4" aria-hidden="true" />,
      }
    default:
      return {
        row: "hover:bg-muted/60",
        badge: "bg-muted text-muted-foreground",
        ring: "ring-border",
        icon: null,
      }
  }
}

function sortPlayers(players: Player[], sortBy: SortKey): Player[] {
  const sorted = [...players]
  if (sortBy === "fee") {
    sorted.sort((a, b) => {
      if (b.totalFee !== a.totalFee) return b.totalFee - a.totalFee
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
      return a.name.localeCompare(b.name, "vi")
    })
  } else {
    sorted.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
      if (b.correctPredictions !== a.correctPredictions) {
        return b.correctPredictions - a.correctPredictions
      }
      return a.name.localeCompare(b.name, "vi")
    })
  }
  return sorted
}

export function Leaderboard({ onUserClick }: { onUserClick?: (player: Player) => void }) {
  const [players, setPlayers] = useState<Player[]>([])
  const [poolTotal, setPoolTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortKey>("points")

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch("/api/users/leaderboard")
        if (res.ok) {
          const data = await res.json()
          setPlayers(data.leaderboard)
          setPoolTotal(data.poolTotal ?? 0)
        }
      } catch (err) {
        console.error("Lỗi lấy bảng xếp hạng:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchLeaderboard()
  }, [])

  const sortedPlayers = useMemo(() => sortPlayers(players, sortBy), [players, sortBy])

  return (
    <section className="w-full max-w-3xl rounded-2xl border border-border bg-card shadow-sm">
      <header className="flex flex-col gap-4 border-b border-border px-4 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Trophy className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-balance text-lg font-semibold tracking-tight text-card-foreground sm:text-xl">
              Bảng xếp hạng dự đoán World Cup 2026
            </h2>
            <p className="text-sm text-muted-foreground">
              Điểm: đúng tỷ số +3 · đúng tính chất (thắng/hòa/thua) +1 · sai 0 đ
            </p>
            <p className="text-sm text-muted-foreground">
              Phí quỹ: không dự đoán / sai cả hai: 10.000 ₫ · đúng tính chất: 5.000 ₫ · đúng tỷ số: miễn phí
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-500/10">
            <Wallet className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm text-muted-foreground">Tổng quỹ hiện tại:</span>
            <span className="text-sm font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
              {formatVnd(poolTotal)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <ArrowUpDown className="size-3.5 shrink-0 text-muted-foreground" />
            <Button
              variant={sortBy === "points" ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs cursor-pointer"
              onClick={() => setSortBy("points")}
            >
              Theo điểm
            </Button>
            <Button
              variant={sortBy === "fee" ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs cursor-pointer"
              onClick={() => setSortBy("fee")}
            >
              Theo tiền nộp
            </Button>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="text-center py-12 text-sm text-muted-foreground font-medium">
          Đang tải bảng xếp hạng...
        </div>
      ) : sortedPlayers.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground font-medium">
          Chưa có thành viên nào trong phòng tham gia.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                <th scope="col" className="px-3 py-3 text-center sm:px-4 w-12">
                  #
                </th>
                <th scope="col" className="px-3 py-3 sm:px-4">
                  Thành viên
                </th>
                <th scope="col" className="px-3 py-3 text-right sm:px-4">
                  Điểm
                </th>
                <th scope="col" className="px-3 py-3 text-right sm:px-4">
                  Phải đóng
                </th>
                <th scope="col" className="hidden px-4 py-3 text-right md:table-cell">
                  Đúng tỷ số
                </th>
                <th scope="col" className="hidden px-4 py-3 text-right sm:table-cell">
                  Tỷ lệ đúng
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedPlayers.map((player, index) => {
                const rank = index + 1
                const styles = rankStyles(rank)

                const accuracy =
                  player.totalPredictions > 0
                    ? Math.round((player.correctPredictions / player.totalPredictions) * 100)
                    : 0

                return (
                  <tr key={player.id} className={`transition-colors ${styles.row}`}>
                    <td className="px-3 py-3 sm:px-4">
                      <div className="flex justify-center">
                        <span
                          className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${styles.badge}`}
                        >
                          {styles.icon ?? rank}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-3 sm:px-4">
                      <div className="flex items-center gap-3">
                        {player.avatar ? (
                          <img
                            src={player.avatar}
                            alt={player.name}
                            className={`flex size-9 shrink-0 items-center justify-center rounded-full object-cover ring-2 ${styles.ring}`}
                          />
                        ) : (
                          <span
                            className={`flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground ring-2 ${styles.ring}`}
                            aria-hidden="true"
                          >
                            {getInitials(player.name)}
                          </span>
                        )}
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => onUserClick?.(player)}
                            className="truncate text-left text-sm font-semibold text-card-foreground transition-colors hover:text-primary hover:underline"
                          >
                            {player.name}
                          </button>
                          <p className="text-xs text-muted-foreground truncate">@{player.nickname}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3 text-right sm:px-4">
                      <span className="text-sm font-bold tabular-nums text-card-foreground">
                        {player.totalPoints}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-right sm:px-4">
                      <span
                        className={`text-sm font-bold tabular-nums ${
                          player.totalFee > 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatVnd(player.totalFee)}
                      </span>
                    </td>

                    <td className="hidden px-4 py-3 text-right md:table-cell">
                      <span className="inline-flex items-center gap-1 text-sm tabular-nums text-muted-foreground">
                        <Target className="size-3.5" aria-hidden="true" />
                        {player.correctPredictions}/{player.totalPredictions}
                      </span>
                    </td>

                    <td className="hidden px-4 py-3 text-right sm:table-cell">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums ${
                          accuracy >= 50
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                            : accuracy >= 30
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {accuracy}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
