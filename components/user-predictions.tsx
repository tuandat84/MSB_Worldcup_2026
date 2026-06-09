"use client"

import { useEffect, useState } from "react"
import {
  ArrowLeft,
  CalendarClock,
  Target,
  Trophy,
  CheckCircle2,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { TeamFlag } from "@/components/team-flag"
import { formatKickoffDate } from "@/lib/format-date"
import { formatVnd } from "@/lib/pool-fee"
import { POINT_EXACT } from "@/lib/match-scoring"

type UserInfo = {
  id: number
  name: string
  nickname: string
  avatar: string | null
  totalPoints: number
  totalPredictions: number
  exactScores: number
  scoredMatches: number
  missedMatches: number
  totalFee: number
}

type PredictionItem = {
  matchId: number
  round: string
  teamA: string
  teamB: string
  kickoff: string
  actualScoreA: number | null
  actualScoreB: number | null
  status: string
  predictedScoreA: number
  predictedScoreB: number
  points: number | null
  fee: number
  isMissed: boolean
}

function getInitials(name: string) {
  if (!name) return "WC"
  const parts = name.trim().split(" ")
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  const first = parts[0]?.[0] ?? ""
  const last = parts[parts.length - 1]?.[0] ?? ""
  return (first + last).toUpperCase()
}

function pointsBadge(points: number | null, status: string, isMissed?: boolean) {
  if (isMissed && status === "finished") {
    return {
      label: "0 đ",
      className: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
    }
  }
  if (status !== "finished" || points === null) {
    return {
      label: "Chờ KQ",
      className: "bg-muted text-muted-foreground",
    }
  }
  if (points === POINT_EXACT) {
    return {
      label: `+${POINT_EXACT} đ`,
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
    }
  }
  if (points === 1) {
    return {
      label: "+1 đ",
      className: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
    }
  }
  return {
    label: "0 đ",
    className: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  }
}

export function UserPredictions({
  userId,
  onBack,
}: {
  userId: number
  onBack: () => void
}) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [predictions, setPredictions] = useState<PredictionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchPredictions() {
      try {
        setLoading(true)
        setError("")
        const res = await fetch(`/api/users/${userId}/predictions`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra")
        setUser(data.user)
        setPredictions(data.predictions)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchPredictions()
  }, [userId])

  if (loading) {
    return (
      <div className="py-12 text-center text-sm font-medium text-muted-foreground">
        Đang tải dự đoán...
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="size-4" />
          Quay lại bảng xếp hạng
        </Button>
        <div className="rounded-lg bg-red-100 p-4 text-sm font-medium text-red-700 dark:bg-red-500/15 dark:text-red-400">
          {error || "Không tìm thấy người dùng"}
        </div>
      </div>
    )
  }

  const accuracy =
    user.scoredMatches > 0
      ? Math.round((user.exactScores / user.scoredMatches) * 100)
      : 0

  return (
    <section className="w-full max-w-4xl">
      <Button variant="outline" size="sm" onClick={onBack} className="mb-4 gap-1.5">
        <ArrowLeft className="size-4" />
        Quay lại bảng xếp hạng
      </Button>

      <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="size-14 rounded-full object-cover ring-2 ring-primary/30"
              />
            ) : (
              <div className="flex size-14 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                {getInitials(user.name)}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-card-foreground">{user.name}</h2>
              <p className="text-sm text-muted-foreground">@{user.nickname}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4 sm:gap-4">
            <div className="rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-500/10">
              <p className="text-lg font-bold tabular-nums text-amber-700 dark:text-amber-400">
                {user.totalPoints}
              </p>
              <p className="text-xs text-muted-foreground">Tổng điểm</p>
            </div>
            <div className="rounded-lg bg-red-50 px-3 py-2 dark:bg-red-500/10">
              <p className="text-lg font-bold tabular-nums text-red-600 dark:text-red-400">
                {formatVnd(user.totalFee)}
              </p>
              <p className="text-xs text-muted-foreground">Tổng phải đóng</p>
            </div>
            <div className="rounded-lg bg-orange-50 px-3 py-2 dark:bg-orange-500/10">
              <p className="text-lg font-bold tabular-nums text-orange-700 dark:text-orange-400">
                {user.totalPredictions}
              </p>
              <p className="text-xs text-muted-foreground">Đã dự đoán</p>
            </div>
            <div className="rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-500/10">
              <p className="text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                {user.exactScores}
              </p>
              <p className="text-xs text-muted-foreground">Đúng tỷ số</p>
            </div>
          </div>
        </div>

        {(user.scoredMatches > 0 || user.missedMatches > 0) && (
          <p className="mt-4 text-sm text-muted-foreground">
            Tỷ lệ đúng tỷ số: <span className="font-semibold text-foreground">{accuracy}%</span>
            {" "}({user.exactScores}/{user.scoredMatches} trận đã có kết quả)
            {user.missedMatches > 0 && (
              <>
                {" "}· Bỏ lỡ:{" "}
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {user.missedMatches} trận
                </span>
              </>
            )}
          </p>
        )}
      </div>

      <header className="mb-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Target className="size-5 text-primary" />
          Chi tiết dự đoán
        </h3>
        <p className="text-sm text-muted-foreground">
          Hiển thị điểm cho các trận đã kết thúc và có tỷ số thực tế
        </p>
      </header>

      {predictions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm font-medium text-muted-foreground">
          Người này chưa có dự đoán nào.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {predictions.map((item) => {
            const formattedKickoff = formatKickoffDate(item.kickoff)
            const badge = pointsBadge(item.points, item.status, item.isMissed)
            const isFinished = item.status === "finished" && item.actualScoreA !== null && item.actualScoreB !== null

            return (
              <li
                key={item.matchId}
                className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/30"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                        {item.round}
                      </span>
                      {isFinished && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                          <CheckCircle2 className="size-3" />
                          Đã kết thúc
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <TeamFlag team={item.teamA} size="sm" />
                      <span className="text-sm text-muted-foreground">vs</span>
                      <TeamFlag team={item.teamB} size="sm" />
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarClock className="size-3.5" />
                      {formattedKickoff}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 md:justify-end">
                    <div className="text-center">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Dự đoán
                      </p>
                      {item.isMissed ? (
                        <p className="text-sm font-bold text-red-600 dark:text-red-400">
                          Không dự đoán
                        </p>
                      ) : (
                        <p className="text-lg font-bold tabular-nums text-primary">
                          {item.predictedScoreA} - {item.predictedScoreB}
                        </p>
                      )}
                    </div>

                    {isFinished && (
                      <div className="text-center">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Kết quả thật
                        </p>
                        <p className="text-lg font-bold tabular-nums text-card-foreground">
                          {item.actualScoreA} - {item.actualScoreB}
                        </p>
                      </div>
                    )}

                    <div className="text-center">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Điểm
                      </p>
                      <span className={`inline-block rounded-md px-2.5 py-1 text-sm font-bold tabular-nums ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>

                    {isFinished && item.fee > 0 && (
                      <div className="text-center">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Mất tiền
                        </p>
                        <span className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2.5 py-1 text-sm font-bold tabular-nums text-red-700 dark:bg-red-500/15 dark:text-red-400">
                          <Wallet className="size-3" />
                          {formatVnd(item.fee)}
                        </span>
                      </div>
                    )}
                    {isFinished && item.fee === 0 && (
                      <div className="text-center">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Mất tiền
                        </p>
                        <span className="inline-block rounded-md bg-emerald-100 px-2.5 py-1 text-sm font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                          Miễn phí
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {isFinished && item.points === POINT_EXACT && (
                  <p className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <Trophy className="size-3.5" />
                    Trúng cả tỷ số và kết quả
                  </p>
                )}
                {isFinished && item.points === 1 && (
                  <p className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400">
                    Trúng kết quả (thắng/hòa/thua) nhưng lệch tỷ số — nộp {formatVnd(item.fee)}
                  </p>
                )}
                {isFinished && item.isMissed && (
                  <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                    Không dự đoán trước giờ đá — 0 điểm, nộp {formatVnd(item.fee)}
                  </p>
                )}
                {isFinished && !item.isMissed && item.points === 0 && (
                  <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                    Sai cả tính chất lẫn tỷ số — nộp {formatVnd(item.fee)}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
