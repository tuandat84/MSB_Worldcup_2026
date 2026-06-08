import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json(
        { error: "Chưa đăng nhập hoặc phiên làm việc hết hạn" },
        { status: 401 }
      )
    }

    const params = await props.params
    const matchId = parseInt(params.id, 10)
    if (isNaN(matchId)) {
      return NextResponse.json({ error: "ID trận đấu không hợp lệ" }, { status: 400 })
    }

    const db = await getDb()
    const match = await db.get(
      `SELECT
        m.id,
        m.round,
        m.team_a as teamA,
        m.team_b as teamB,
        m.kickoff,
        m.score_a as actualScoreA,
        m.score_b as actualScoreB,
        m.status,
        p.predicted_score_a as predictedScoreA,
        p.predicted_score_b as predictedScoreB,
        p.points as pointsAwarded
      FROM matches m
      LEFT JOIN predictions p ON m.id = p.match_id AND p.user_id = ?
      WHERE m.id = ?`,
      [user.id, matchId]
    )

    if (!match) {
      return NextResponse.json({ error: "Trận đấu không tồn tại" }, { status: 404 })
    }

    return NextResponse.json({ match })
  } catch (error: any) {
    console.error("Get Match Detail Error:", error)
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi lấy thông tin trận đấu" },
      { status: 500 }
    )
  }
}
