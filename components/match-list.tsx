"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { ChevronRight, Clock, Wallet, Save, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TeamFlag } from "@/components/team-flag"
import { formatDateHeader, formatTime, parseKickoff, toVNDateKey } from "@/lib/format-date"
import { formatVnd } from "@/lib/pool-fee"

type MatchStatus = "upcoming" | "open" | "locked" | "finished"

type Match = {
  id: number
  round: string
  teamA: string
  teamB: string
  kickoff: string
  status: MatchStatus
  actualScoreA: number | null
  actualScoreB: number | null
  predictedScoreA: number | null
  predictedScoreB: number | null
  pointsAwarded: number | null
  isMissed: boolean
  poolFee: number
}

const statusConfig: Record<MatchStatus, { label: string; className: string }> = {
  upcoming: {
    label: "Sắp diễn ra",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  },
  open: {
    label: "Đang mở dự đoán",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  },
  locked: {
    label: "Đã khóa",
    className: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  },
  finished: {
    label: "Kết thúc",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
}


function MatchCard({
  match,
  onViewDetail,
  onPredictionSaved,
}: {
  match: Match
  onViewDetail: (id: number) => void
  onPredictionSaved: (matchId: number, scoreA: number, scoreB: number) => void
}) {
  const status = statusConfig[match.status]
  const isFinished = match.status === "finished" && match.actualScoreA !== null && match.actualScoreB !== null
  const hasPrediction = match.predictedScoreA !== null && !match.isMissed
  const canPredict = match.status === "open"
  const time = formatTime(match.kickoff)

  const [scoreA, setScoreA] = useState("")
  const [scoreB, setScoreB] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState("")
  const [saveMsg, setSaveMsg] = useState("")
  const saveMsgTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setScoreA(
      match.predictedScoreA !== null && !match.isMissed ? String(match.predictedScoreA) : ""
    )
    setScoreB(
      match.predictedScoreB !== null && !match.isMissed ? String(match.predictedScoreB) : ""
    )
    setSaveErr("")
  }, [match.id, match.predictedScoreA, match.predictedScoreB, match.isMissed])

  useEffect(() => {
    return () => {
      if (saveMsgTimer.current) clearTimeout(saveMsgTimer.current)
    }
  }, [])

  const showSave = canPredict && scoreA !== "" && scoreB !== ""

  async function handleSave() {
    if (!showSave) return
    setSaving(true)
    setSaveErr("")
    setSaveMsg("")
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match.id,
          predictedScoreA: scoreA,
          predictedScoreB: scoreB,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra")
      onPredictionSaved(match.id, parseInt(scoreA, 10), parseInt(scoreB, 10))
      if (saveMsgTimer.current) clearTimeout(saveMsgTimer.current)
      setSaveMsg("Đã lưu dự đoán")
      saveMsgTimer.current = setTimeout(() => {
        setSaveMsg("")
        saveMsgTimer.current = null
      }, 5000)
    } catch (err: unknown) {
      setSaveErr(err instanceof Error ? err.message : "Không thể lưu dự đoán")
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className="group border-b border-border last:border-b-0">
      <div className="flex flex-col gap-3 px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">{match.round}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${status.className}`}>
            {status.label}
          </span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
          <TeamFlag team={match.teamA} size="lg" align="right" className="w-full justify-end" />

          <div className="flex min-w-[88px] flex-col items-center justify-center gap-1.5">
            {isFinished ? (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Kết quả
                </p>
                <span className="text-2xl font-extrabold tabular-nums tracking-wider text-primary sm:text-3xl">
                  {match.actualScoreA}
                  <span className="mx-1 text-muted-foreground">-</span>
                  {match.actualScoreB}
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1 text-lg font-bold tabular-nums text-foreground sm:text-xl">
                  <Clock className="size-4 text-muted-foreground" />
                  {time}
                </span>
                {canPredict ? (
                  <div className="mt-1 flex flex-col items-center gap-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Dự đoán tỷ số
                    </p>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        placeholder="0"
                        value={scoreA}
                        onChange={(e) => {
                          setScoreA(e.target.value)
                          setSaveMsg("")
                        }}
                        disabled={saving}
                        className="h-9 w-11 text-center font-bold tabular-nums p-1"
                        aria-label={`Tỷ số ${match.teamA}`}
                      />
                      <span className="font-bold text-muted-foreground">:</span>
                      <Input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        placeholder="0"
                        value={scoreB}
                        onChange={(e) => {
                          setScoreB(e.target.value)
                          setSaveMsg("")
                        }}
                        disabled={saving}
                        className="h-9 w-11 text-center font-bold tabular-nums p-1"
                        aria-label={`Tỷ số ${match.teamB}`}
                      />
                    </div>
                    {saveErr && (
                      <p className="max-w-[140px] text-center text-[10px] font-medium text-red-600 dark:text-red-400">
                        {saveErr}
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="text-[10px] font-medium uppercase text-muted-foreground">vs</span>
                )}
              </>
            )}

            {!canPredict && (hasPrediction || match.isMissed) && (
              <div className="mt-0.5 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Dự đoán
                </p>
                {match.isMissed ? (
                  <span className="text-xs font-bold text-red-600 dark:text-red-400">Không dự đoán</span>
                ) : (
                  <span className="text-sm font-bold tabular-nums text-foreground">
                    {match.predictedScoreA} - {match.predictedScoreB}
                  </span>
                )}
              </div>
            )}

            {isFinished && match.pointsAwarded !== null && (
              <span
                className={`text-[10px] font-semibold ${
                  match.pointsAwarded > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground"
                }`}
              >
                {match.pointsAwarded} điểm
              </span>
            )}

            {isFinished && match.poolFee > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-500/15 dark:text-red-400">
                <Wallet className="size-3" />
                {formatVnd(match.poolFee)}
              </span>
            )}
            {isFinished && match.poolFee === 0 && (hasPrediction || match.isMissed) && (
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                Miễn phí
              </span>
            )}
          </div>

          <TeamFlag team={match.teamB} size="lg" align="left" className="w-full" />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {showSave && (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="h-8 shrink-0 gap-1 text-xs font-semibold"
              >
                <Save className="size-3.5" />
                {saving ? "Đang lưu..." : "Lưu dự đoán"}
              </Button>
            )}
            {saveMsg && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
                {saveMsg}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetail(match.id)}
            className="h-8 gap-1 text-xs font-semibold text-primary hover:text-primary"
          >
            Phân tích & chi tiết
            <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </div>
    </article>
  )
}

export function MatchList({ onMatchClick }: { onMatchClick: (matchId: number) => void }) {
  const [matches, setMatches] = useState<Match[]>([])
  const [filter, setFilter] = useState<"all" | "open" | "predicted" | "finished">("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMatches() {
      try {
        const res = await fetch("/api/matches")
        if (res.ok) {
          const data = await res.json()
          setMatches(data.matches)
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách trận đấu:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchMatches()
  }, [])

  const filteredMatches = useMemo(
    () =>
      matches
        .filter((m) => {
          if (filter === "open") return m.status === "open"
          if (filter === "finished") return m.status === "finished"
          if (filter === "predicted") return m.predictedScoreA !== null && !m.isMissed
          return true
        })
        .sort((a, b) => parseKickoff(a.kickoff).getTime() - parseKickoff(b.kickoff).getTime()),
    [matches, filter]
  )

  function handlePredictionSaved(matchId: number, scoreA: number, scoreB: number) {
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? {
              ...m,
              predictedScoreA: scoreA,
              predictedScoreB: scoreB,
              isMissed: false,
            }
          : m
      )
    )
  }

  const groupedByDate = useMemo(() => {
    const groups: { dateKey: string; label: string; matches: Match[] }[] = []
    const map = new Map<string, Match[]>()

    for (const m of filteredMatches) {
      const dateKey = toVNDateKey(m.kickoff)
      if (!map.has(dateKey)) map.set(dateKey, [])
      map.get(dateKey)!.push(m)
    }

    for (const [dateKey, dayMatches] of map) {
      groups.push({
        dateKey,
        label: formatDateHeader(dayMatches[0].kickoff),
        matches: dayMatches,
      })
    }

    return groups
  }, [filteredMatches])

  return (
    <section className="w-full max-w-3xl">
      <header className="mb-6 border-b border-border pb-4">
        <h2 className="text-balance text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Lịch thi đấu World Cup 2026
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Nhập tỷ số trực tiếp tại trận đang mở hoặc xem phân tích chi tiết từng trận
        </p>

        <div className="mt-4 flex flex-wrap gap-1 rounded-lg bg-muted p-1">
          {(["all", "open", "predicted", "finished"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === tab
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "all" && "Tất cả"}
              {tab === "open" && "Đang mở"}
              {tab === "predicted" && "Đã dự đoán"}
              {tab === "finished" && "Đã kết thúc"}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="py-16 text-center text-sm font-medium text-muted-foreground">
          Đang tải lịch thi đấu...
        </div>
      ) : groupedByDate.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm font-medium text-muted-foreground">
          Không có trận đấu nào phù hợp bộ lọc.
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByDate.map((group) => (
            <section key={group.dateKey} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <header className="border-b border-border bg-muted/40 px-4 py-3 sm:px-5">
                <h3 className="text-sm font-bold text-foreground">{group.label}</h3>
              </header>
              <div>
                {group.matches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onViewDetail={onMatchClick}
                    onPredictionSaved={handlePredictionSaved}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  )
}
