import { Database } from "sqlite"
import sqlite3 from "sqlite3"

export function calculatePredictionPoints(
  predictedA: number,
  predictedB: number,
  actualA: number,
  actualB: number
): number {
  const actualOutcome = actualA > actualB ? "A" : actualA === actualB ? "D" : "B"
  const predictedOutcome =
    predictedA > predictedB ? "A" : predictedA === predictedB ? "D" : "B"

  if (predictedA === actualA && predictedB === actualB) return 2
  if (actualOutcome === predictedOutcome) return 1
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
