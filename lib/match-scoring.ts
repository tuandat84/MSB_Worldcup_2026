import { Database } from "sqlite"
import sqlite3 from "sqlite3"

export const POINT_EXACT = 3
export const POINT_OUTCOME = 1

export function calculatePredictionPoints(
  predictedA: number,
  predictedB: number,
  actualA: number,
  actualB: number
): number {
  const actualOutcome = actualA > actualB ? "A" : actualA === actualB ? "D" : "B"
  const predictedOutcome =
    predictedA > predictedB ? "A" : predictedA === predictedB ? "D" : "B"

  if (predictedA === actualA && predictedB === actualB) return POINT_EXACT
  if (actualOutcome === predictedOutcome) return POINT_OUTCOME
  return 0
}

/** Ghi nhận phạt cho người chơi không dự đoán trước khi trận kết thúc */
export async function applyMissedPenalties(
  db: Database<sqlite3.Database, sqlite3.Statement>,
  matchId: number
): Promise<number> {
  const result = await db.run(
    `INSERT INTO predictions (user_id, match_id, predicted_score_a, predicted_score_b, points, is_missed)
     SELECT u.id, ?, -1, -1, 0, 1
     FROM users u
     WHERE u.role != 'admin'
       AND datetime(u.created_at) <= (SELECT kickoff FROM matches WHERE id = ?)
       AND NOT EXISTS (
         SELECT 1 FROM predictions p WHERE p.user_id = u.id AND p.match_id = ?
       )`,
    [matchId, matchId, matchId]
  )
  return result.changes ?? 0
}

/** Backfill phạt bỏ lỡ cho các trận đã kết thúc trước khi có rule mới */
export async function backfillMissedPenalties(
  db: Database<sqlite3.Database, sqlite3.Statement>
): Promise<void> {
  const finished = (await db.all(
    "SELECT id FROM matches WHERE status = 'finished'"
  )) as Array<{ id: number }>

  for (const match of finished) {
    await applyMissedPenalties(db, match.id)
  }
}

/** Tính lại điểm cho các trận đã kết thúc (khi đổi rule điểm) */
export async function backfillPredictionPoints(
  db: Database<sqlite3.Database, sqlite3.Statement>
): Promise<number> {
  const rows = (await db.all(`
    SELECT p.user_id, p.match_id, p.points,
           p.predicted_score_a, p.predicted_score_b,
           m.score_a, m.score_b
    FROM predictions p
    JOIN matches m ON m.id = p.match_id
    WHERE m.status = 'finished'
      AND COALESCE(p.is_missed, 0) = 0
      AND m.score_a IS NOT NULL AND m.score_b IS NOT NULL
  `)) as Array<{
    user_id: number
    match_id: number
    points: number | null
    predicted_score_a: number
    predicted_score_b: number
    score_a: number
    score_b: number
  }>

  let updated = 0
  for (const row of rows) {
    const points = calculatePredictionPoints(
      row.predicted_score_a,
      row.predicted_score_b,
      row.score_a,
      row.score_b
    )
    if (row.points !== points) {
      await db.run(
        "UPDATE predictions SET points = ? WHERE user_id = ? AND match_id = ?",
        [points, row.user_id, row.match_id]
      )
      updated++
    }
  }
  if (updated > 0) {
    console.log(`Đã tính lại điểm cho ${updated} dự đoán (rule mới: đúng tỷ số +3).`)
  }
  return updated
}

/** Cập nhật tỷ số trận đấu và tính điểm cho tất cả dự đoán */
export async function applyMatchResult(
  db: Database<sqlite3.Database, sqlite3.Statement>,
  matchId: number,
  scoreA: number,
  scoreB: number
): Promise<void> {
  await db.run("BEGIN TRANSACTION")
  try {
    await db.run(
      `UPDATE matches SET score_a = ?, score_b = ?, status = 'finished' WHERE id = ?`,
      [scoreA, scoreB, matchId]
    )

    const predictions = (await db.all(
      "SELECT user_id, predicted_score_a, predicted_score_b FROM predictions WHERE match_id = ? AND COALESCE(is_missed, 0) = 0",
      [matchId]
    )) as Array<{
      user_id: number
      predicted_score_a: number
      predicted_score_b: number
    }>

    for (const pred of predictions) {
      const points = calculatePredictionPoints(
        pred.predicted_score_a,
        pred.predicted_score_b,
        scoreA,
        scoreB
      )
      await db.run(
        "UPDATE predictions SET points = ? WHERE user_id = ? AND match_id = ?",
        [points, pred.user_id, matchId]
      )
    }

    await applyMissedPenalties(db, matchId)

    await db.run("COMMIT")
  } catch (err) {
    await db.run("ROLLBACK")
    throw err
  }
}
