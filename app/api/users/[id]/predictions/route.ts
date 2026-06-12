import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { getDb } from "@/lib/db"
// import { calculatePoolFee, FEE_WRONG_BOTH, FEE_WRONG_ONE } from "@/lib/pool-fee"
import { POINT_EXACT } from "@/lib/match-scoring"

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getUserFromRequest(req)
    if (!currentUser) {
      return NextResponse.json(
        { error: "Chưa đăng nhập hoặc phiên làm việc hết hạn" },
        { status: 401 }
      )
    }

    const params = await props.params
    const userId = parseInt(params.id, 10)
    if (isNaN(userId)) {
      return NextResponse.json({ error: "ID người dùng không hợp lệ" }, { status: 400 })
    }

    const db = await getDb()

    const user = await db.get(
      "SELECT id, fullname, nickname, avatar FROM users WHERE id = ?",
      [userId]
    )
    if (!user) {
      return NextResponse.json({ error: "Người dùng không tồn tại" }, { status: 404 })
    }

    const stats = await db.get(
      `SELECT
        COALESCE(SUM(points), 0) as totalPoints,
        COUNT(*) as totalPredictions,
        COALESCE(SUM(CASE WHEN points = ${POINT_EXACT} THEN 1 ELSE 0 END), 0) as exactScores,
        COALESCE(SUM(CASE WHEN points IS NOT NULL THEN 1 ELSE 0 END), 0) as scoredMatches,
        COALESCE(SUM(CASE WHEN is_missed = 1 THEN 1 ELSE 0 END), 0) as missedMatches
      FROM predictions
      WHERE user_id = ?`,
      [userId]
    )
    /*
    totalFee: COALESCE(SUM(
      CASE
        WHEN is_missed = 1 OR points = 0 THEN ${FEE_WRONG_BOTH}
        WHEN points = 1 THEN ${FEE_WRONG_ONE}
        ELSE 0
      END
    ), 0)
    */

    const predictions = await db.all(
      `SELECT
        m.id as matchId,
        m.round,
        m.team_a as teamA,
        m.team_b as teamB,
        m.kickoff,
        m.score_a as actualScoreA,
        m.score_b as actualScoreB,
        m.status,
        p.predicted_score_a as predictedScoreA,
        p.predicted_score_b as predictedScoreB,
        p.points,
        p.is_missed as isMissed
      FROM predictions p
      JOIN matches m ON p.match_id = m.id
      WHERE p.user_id = ?
      ORDER BY m.kickoff ASC, m.id ASC`,
      [userId]
    )

    const predictionsNormalized = predictions.map(
      (p: { isMissed: number }) => ({
        ...p,
        isMissed: p.isMissed === 1,
        // fee: calculatePoolFee(p.points, p.isMissed === 1),
      })
    )

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.fullname,
        nickname: user.nickname,
        avatar: user.avatar,
        totalPoints: stats?.totalPoints ?? 0,
        totalPredictions: stats?.totalPredictions ?? 0,
        exactScores: stats?.exactScores ?? 0,
        scoredMatches: stats?.scoredMatches ?? 0,
        missedMatches: stats?.missedMatches ?? 0,
        // totalFee: stats?.totalFee ?? 0,
      },
      predictions: predictionsNormalized,
    })
  } catch (error: any) {
    console.error("User Predictions Error:", error)
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi lấy dự đoán của người dùng" },
      { status: 500 }
    )
  }
}
