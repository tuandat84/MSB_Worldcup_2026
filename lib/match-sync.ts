import { Database } from "sqlite"
import sqlite3 from "sqlite3"
import {
  fetchApiFootballResults,
  fetchEspnResults,
  mergeExternalResults,
  matchExternalToDb,
} from "./external-results"
import { applyMatchResult } from "./match-scoring"

export type SyncReport = {
  locked: number
  updated: number
  skipped: number
  pendingManual: number
  sources: string[]
  lastSyncAt: string
}

let lastFullSyncAt = 0
const SYNC_COOLDOWN_MS = 5 * 60 * 1000
const MATCH_DURATION_MS = 105 * 60 * 1000
const MANUAL_THRESHOLD_MS = 3 * 60 * 60 * 1000

type DbMatch = {
  id: number
  team_a: string
  team_b: string
  kickoff: string
  status: string
}

/** Khóa dự đoán khi trận đã bắt đầu */
export async function lockPastMatches(
  db: Database<sqlite3.Database, sqlite3.Statement>
): Promise<number> {
  const now = new Date().toISOString()
  const result = await db.run(
    `UPDATE matches SET status = 'locked'
     WHERE status = 'open' AND kickoff <= ?`,
    [now]
  )
  return result.changes ?? 0
}

/** Đồng bộ kết quả từ ESPN / API-Football và tính điểm tự động */
export async function syncMatchResults(
  db: Database<sqlite3.Database, sqlite3.Statement>,
  options?: { force?: boolean }
): Promise<SyncReport> {
  const force = options?.force ?? false
  const now = Date.now()

  const locked = await lockPastMatches(db)

  const shouldFetch = force || now - lastFullSyncAt >= SYNC_COOLDOWN_MS
  if (!shouldFetch) {
    const pendingManual = await countPendingManual(db)
    return {
      locked,
      updated: 0,
      skipped: 0,
      pendingManual,
      sources: [],
      lastSyncAt: new Date(lastFullSyncAt).toISOString(),
    }
  }

  const cutoff = new Date(now - MATCH_DURATION_MS).toISOString()
  const pending: DbMatch[] = await db.all(
    `SELECT id, team_a, team_b, kickoff, status
     FROM matches
     WHERE status != 'finished' AND kickoff <= ?
     ORDER BY kickoff ASC`,
    [cutoff]
  )

  if (pending.length === 0) {
    lastFullSyncAt = now
    return {
      locked,
      updated: 0,
      skipped: 0,
      pendingManual: 0,
      sources: [],
      lastSyncAt: new Date(now).toISOString(),
    }
  }

  const from = new Date(pending[0].kickoff)
  from.setUTCDate(from.getUTCDate() - 1)
  const to = new Date(pending[pending.length - 1].kickoff)
  to.setUTCDate(to.getUTCDate() + 1)

  const [apiFootball, espn] = await Promise.all([
    fetchApiFootballResults(from, to),
    fetchEspnResults(from, to),
  ])
  const external = mergeExternalResults(apiFootball, espn)
  const sources = [
    ...(apiFootball.length > 0 ? ["api-football"] : []),
    ...(espn.length > 0 ? ["espn"] : []),
  ]

  let updated = 0
  let skipped = 0

  for (const match of pending) {
    const result = matchExternalToDb(
      match.team_a,
      match.team_b,
      match.kickoff,
      external
    )

    if (!result) {
      skipped++
      continue
    }

    await applyMatchResult(db, match.id, result.scoreA, result.scoreB)
    updated++
    console.log(
      `Auto result: ${match.team_a} ${result.scoreA}-${result.scoreB} ${match.team_b} (${result.source})`
    )
  }

  lastFullSyncAt = now
  const pendingManual = await countPendingManual(db)

  return {
    locked,
    updated,
    skipped,
    pendingManual,
    sources,
    lastSyncAt: new Date(now).toISOString(),
  }
}

async function countPendingManual(
  db: Database<sqlite3.Database, sqlite3.Statement>
): Promise<number> {
  const threshold = new Date(Date.now() - MANUAL_THRESHOLD_MS).toISOString()
  const row = await db.get<{ count: number }>(
    `SELECT COUNT(*) as count FROM matches
     WHERE status = 'locked' AND kickoff <= ?`,
    [threshold]
  )
  return row?.count ?? 0
}

/** Trận cần admin nhập tay (đã qua 3h mà chưa có kết quả) */
export async function getPendingManualMatches(
  db: Database<sqlite3.Database, sqlite3.Statement>
) {
  const threshold = new Date(Date.now() - MANUAL_THRESHOLD_MS).toISOString()
  return db.all(
    `SELECT id, round, team_a as teamA, team_b as teamB, kickoff, status
     FROM matches
     WHERE status = 'locked' AND kickoff <= ?
     ORDER BY kickoff ASC`,
    [threshold]
  )
}
