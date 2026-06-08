"use client"

import { useEffect, useState } from "react"
import {
  ArrowLeft,
  CalendarClock,
  Sparkles,
  TrendingUp,
  Save,
  Check,
  AlertCircle,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TeamFlag } from "@/components/team-flag"
import { getTeamViName } from "@/lib/team-data"
import { formatKickoffDate } from "@/lib/format-date"

type MatchDetail = {
  id: number
  round: string
  teamA: string
  teamB: string
  kickoff: string
  status: string
  actualScoreA: number | null
  actualScoreB: number | null
  predictedScoreA: number | null
  predictedScoreB: number | null
  pointsAwarded: number | null
}

type Insights = {
  overview: string
  teamAInfo: string | null
  teamBInfo: string | null
  odds: {
    teamAWin: number
    draw: number
    teamBWin: number
    favorite: "A" | "B" | "even"
  }
  aiPrediction: {
    scoreA: number
    scoreB: number
    confidence: number
    summary: string
    reasoning: string
    source: "openai" | "local"
  }
}

export function MatchDetailView({
  matchId,
  onBack,
}: {
  matchId: number
  onBack: () => void
}) {
  const [match, setMatch] = useState<MatchDetail | null>(null)
  const [insights, setInsights] = useState<Insights | null>(null)
  const [loading, setLoading] = useState(true)
  const [insightsLoading, setInsightsLoading] = useState(true)
  const [error, setError] = useState("")

  const [scoreA, setScoreA] = useState("")
  const [scoreB, setScoreB] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState("")
  const [saveErr, setSaveErr] = useState("")

  async function fetchMatch() {
    const res = await fetch(`/api/matches/${matchId}`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra")
    setMatch(data.match)
    setScoreA(data.match.predictedScoreA !== null ? String(data.match.predictedScoreA) : "")
    setScoreB(data.match.predictedScoreB !== null ? String(data.match.predictedScoreB) : "")
  }

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError("")
        await fetchMatch()
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [matchId])

  useEffect(() => {
    async function loadInsights() {
      try {
        setInsightsLoading(true)
        const res = await fetch(`/api/matches/${matchId}/insights`)
        const data = await res.json()
        if (res.ok) setInsights(data.insights)
      } catch (err) {
        console.error("Lỗi tải phân tích:", err)
      } finally {
        setInsightsLoading(false)
      }
    }
    loadInsights()
  }, [matchId])

  async function handleSave() {
    if (!match) return
    if (scoreA === "" || scoreB === "") {
      setSaveErr("Vui lòng nhập đủ tỷ số!")
      return
    }

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
      setSaveMsg("Đã lưu dự đoán thành công!")
      await fetchMatch()
      setTimeout(() => setSaveMsg(""), 3000)
    } catch (err: any) {
      setSaveErr(err.message)
    } finally {
      setSaving(false)
    }
  }

  function applyAiSuggestion() {
    if (!insights) return
    setScoreA(String(insights.aiPrediction.scoreA))
    setScoreB(String(insights.aiPrediction.scoreB))
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-sm font-medium text-muted-foreground">
        Đang tải chi tiết trận đấu...
      </div>
    )
  }

  if (error || !match) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="size-4" />
          Quay lại danh sách
        </Button>
        <div className="rounded-lg bg-red-100 p-4 text-sm font-medium text-red-700 dark:bg-red-500/15 dark:text-red-400">
          {error || "Không tìm thấy trận đấu"}
        </div>
      </div>
    )
  }

  const formattedKickoff = formatKickoffDate(match.kickoff)

  const canPredict = match.status === "open"
  const isFinished = match.status === "finished"

  return (
    <section className="w-full max-w-4xl space-y-5">
      <Button variant="outline" size="sm" onClick={onBack} className="gap-1.5">
        <ArrowLeft className="size-4" />
        Quay lại danh sách trận
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
              {match.round}
            </span>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {match.status === "open" ? "Đang mở dự đoán" : match.status === "finished" ? "Đã kết thúc" : "Đã khóa"}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <TeamFlag team={match.teamA} size="lg" align="right" className="justify-end" />
            <span className="text-lg font-bold text-muted-foreground">vs</span>
            <TeamFlag team={match.teamB} size="lg" align="left" />
          </div>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarClock className="size-4" />
            {formattedKickoff}
          </p>
          {isFinished && match.actualScoreA !== null && match.actualScoreB !== null && (
            <p className="text-lg font-bold text-primary">
              Kết quả: {match.actualScoreA} - {match.actualScoreB}
              {match.pointsAwarded !== null && (
                <span className="ml-2 text-sm font-semibold text-emerald-600">
                  (Bạn được +{match.pointsAwarded} điểm)
                </span>
              )}
            </p>
          )}
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="size-5 text-primary" />
            Tổng quan trận đấu
          </CardTitle>
        </CardHeader>
        <CardContent>
          {insightsLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải thông tin từ nguồn công khai...</p>
          ) : insights ? (
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p className="text-foreground">{insights.overview}</p>
              {insights.teamAInfo && (
                <p><span className="font-semibold text-foreground">{getTeamViName(match.teamA)}:</span> {insights.teamAInfo}</p>
              )}
              {insights.teamBInfo && (
                <p><span className="font-semibold text-foreground">{getTeamViName(match.teamB)}:</span> {insights.teamBInfo}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Không tải được thông tin tổng quan.</p>
          )}
        </CardContent>
      </Card>

      {insights && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="size-5 text-primary" />
                Tỷ lệ kèo dự đoán
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-muted/60 p-3">
                  <p className="text-xs text-muted-foreground">{getTeamViName(match.teamA)} thắng</p>
                  <p className="text-xl font-bold tabular-nums text-foreground">{insights.odds.teamAWin}%</p>
                </div>
                <div className="rounded-lg bg-muted/60 p-3">
                  <p className="text-xs text-muted-foreground">Hòa</p>
                  <p className="text-xl font-bold tabular-nums text-foreground">{insights.odds.draw}%</p>
                </div>
                <div className="rounded-lg bg-muted/60 p-3">
                  <p className="text-xs text-muted-foreground">{getTeamViName(match.teamB)} thắng</p>
                  <p className="text-xl font-bold tabular-nums text-foreground">{insights.odds.teamBWin}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="size-5 text-amber-600" />
                Dự đoán AI
                <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-900 dark:bg-amber-500/20 dark:text-amber-300">
                  {insights.aiPrediction.source === "openai" ? "OpenAI" : "Phân tích nội bộ"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-lg font-bold text-foreground">
                Gợi ý tỷ số: {insights.aiPrediction.scoreA} - {insights.aiPrediction.scoreB}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  (độ tin cậy {insights.aiPrediction.confidence}%)
                </span>
              </p>
              <p className="text-sm text-foreground">{insights.aiPrediction.summary}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{insights.aiPrediction.reasoning}</p>
              {canPredict && (
                <Button variant="outline" size="sm" onClick={applyAiSuggestion} className="gap-1.5">
                  <Sparkles className="size-3.5" />
                  Áp dụng gợi ý AI
                </Button>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dự đoán của bạn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {canPredict ? (
            <>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">{getTeamViName(match.teamA)}</p>
                  <Input
                    type="number"
                    min={0}
                    value={scoreA}
                    onChange={(e) => setScoreA(e.target.value)}
                    className="h-12 w-16 text-center text-xl font-bold"
                  />
                </div>
                <span className="mt-5 text-2xl font-bold text-muted-foreground">:</span>
                <div className="text-center">
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">{getTeamViName(match.teamB)}</p>
                  <Input
                    type="number"
                    min={0}
                    value={scoreB}
                    onChange={(e) => setScoreB(e.target.value)}
                    className="h-12 w-16 text-center text-xl font-bold"
                  />
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full gap-1.5">
                <Save className="size-4" />
                {saving ? "Đang lưu..." : "Lưu dự đoán"}
              </Button>
            </>
          ) : match.predictedScoreA !== null ? (
            <p className="text-center text-lg font-bold text-foreground">
              Dự đoán của bạn: {match.predictedScoreA} - {match.predictedScoreB}
            </p>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              Trận đấu đã khóa hoặc kết thúc, không thể dự đoán.
            </p>
          )}

          {saveMsg && (
            <p className="flex items-center justify-center gap-1 text-sm font-semibold text-emerald-600">
              <Check className="size-4" /> {saveMsg}
            </p>
          )}
          {saveErr && (
            <p className="flex items-center justify-center gap-1 text-sm font-semibold text-red-600">
              <AlertCircle className="size-4" /> {saveErr}
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
