import { isSameTeam, normalizeTeamName } from "./team-aliases"

export type ExternalResult = {
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  kickoff: string
  status: "scheduled" | "live" | "finished"
  source: "espn" | "api-football"
}

const ESPN_BASE =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard"

function formatEspnDate(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  return `${y}${m}${day}`
}

function formatApiDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function parseEspnEvents(data: { events?: unknown[] }): ExternalResult[] {
  const results: ExternalResult[] = []

  for (const event of data.events ?? []) {
    const e = event as {
      date?: string
      competitions?: Array<{
        status?: { type?: { completed?: boolean; state?: string } }
        competitors?: Array<{
          homeAway?: string
          score?: string
          team?: { displayName?: string }
        }>
      }>
    }

    const comp = e.competitions?.[0]
    if (!comp) continue

    const home = comp.competitors?.find((c) => c.homeAway === "home")
    const away = comp.competitors?.find((c) => c.homeAway === "away")
    if (!home?.team?.displayName || !away?.team?.displayName) continue

    const state = comp.status?.type?.state
    const completed = comp.status?.type?.completed === true
    let status: ExternalResult["status"] = "scheduled"
    if (completed || state === "post") status = "finished"
    else if (state === "in") status = "live"

    results.push({
      homeTeam: normalizeTeamName(home.team.displayName),
      awayTeam: normalizeTeamName(away.team.displayName),
      homeScore: parseInt(home.score ?? "0", 10) || 0,
      awayScore: parseInt(away.score ?? "0", 10) || 0,
      kickoff: e.date ?? "",
      status,
      source: "espn",
    })
  }

  return results
}

export async function fetchEspnResults(
  from: Date,
  to: Date
): Promise<ExternalResult[]> {
  const dates = new Set<string>()
  const cursor = new Date(from)
  cursor.setUTCHours(0, 0, 0, 0)
  const end = new Date(to)
  end.setUTCHours(23, 59, 59, 999)

  while (cursor <= end) {
    dates.add(formatEspnDate(cursor))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  const all: ExternalResult[] = []
  for (const date of dates) {
    try {
      const res = await fetch(`${ESPN_BASE}?dates=${date}`, {
        cache: "no-store",
      })
      if (!res.ok) continue
      const data = await res.json()
      all.push(...parseEspnEvents(data))
    } catch (err) {
      console.error(`ESPN fetch failed for ${date}:`, err)
    }
  }

  return all
}

export async function fetchApiFootballResults(
  from: Date,
  to: Date
): Promise<ExternalResult[]> {
  const key = process.env.API_FOOTBALL_KEY
  if (!key) return []

  const url = new URL("https://v3.football.api-sports.io/fixtures")
  url.searchParams.set("league", "1")
  url.searchParams.set("season", "2026")
  url.searchParams.set("from", formatApiDate(from))
  url.searchParams.set("to", formatApiDate(to))

  try {
    const res = await fetch(url.toString(), {
      headers: { "x-apisports-key": key },
      cache: "no-store",
    })
    if (!res.ok) {
      console.error("API-Football error:", res.status, await res.text())
      return []
    }

    const data = (await res.json()) as {
      response?: Array<{
        fixture?: { date?: string; status?: { short?: string } }
        teams?: { home?: { name?: string }; away?: { name?: string } }
        goals?: { home?: number | null; away?: number | null }
      }>
    }

    const finishedStatuses = new Set(["FT", "AET", "PEN"])
    const liveStatuses = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE"])

    return (data.response ?? []).map((item) => {
      const short = item.fixture?.status?.short ?? ""
      let status: ExternalResult["status"] = "scheduled"
      if (finishedStatuses.has(short)) status = "finished"
      else if (liveStatuses.has(short)) status = "live"

      return {
        homeTeam: normalizeTeamName(item.teams?.home?.name ?? ""),
        awayTeam: normalizeTeamName(item.teams?.away?.name ?? ""),
        homeScore: item.goals?.home ?? 0,
        awayScore: item.goals?.away ?? 0,
        kickoff: item.fixture?.date ?? "",
        status,
        source: "api-football" as const,
      }
    })
  } catch (err) {
    console.error("API-Football fetch failed:", err)
    return []
  }
}

/** Ghép kết quả: ưu tiên API-Football, bổ sung ESPN */
export function mergeExternalResults(
  primary: ExternalResult[],
  secondary: ExternalResult[]
): ExternalResult[] {
  const map = new Map<string, ExternalResult>()

  const keyOf = (r: ExternalResult) =>
    [r.homeTeam, r.awayTeam, r.kickoff.slice(0, 10)].join("|")

  for (const r of secondary) map.set(keyOf(r), r)
  for (const r of primary) map.set(keyOf(r), r)

  return [...map.values()]
}

export function matchExternalToDb(
  teamA: string,
  teamB: string,
  kickoff: string,
  external: ExternalResult[],
  maxDiffMs = 3 * 60 * 60 * 1000
): { scoreA: number; scoreB: number; source: string } | null {
  const kickoffMs = new Date(kickoff).getTime()

  for (const ext of external) {
    if (ext.status !== "finished") continue

    const extMs = new Date(ext.kickoff).getTime()
    if (Math.abs(extMs - kickoffMs) > maxDiffMs) continue

    const homeIsA = isSameTeam(teamA, ext.homeTeam) && isSameTeam(teamB, ext.awayTeam)
    const homeIsB = isSameTeam(teamB, ext.homeTeam) && isSameTeam(teamA, ext.awayTeam)

    if (homeIsA) {
      return { scoreA: ext.homeScore, scoreB: ext.awayScore, source: ext.source }
    }
    if (homeIsB) {
      return { scoreA: ext.awayScore, scoreB: ext.homeScore, source: ext.source }
    }
  }

  return null
}
