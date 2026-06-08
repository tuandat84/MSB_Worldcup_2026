import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { buildMatchInsights } from "@/lib/match-insights"

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
      `SELECT id, round, team_a as teamA, team_b as teamB, kickoff, status
       FROM matches WHERE id = ?`,
      [matchId]
    )

    if (!match) {
      return NextResponse.json({ error: "Trận đấu không tồn tại" }, { status: 404 })
    }

    const insights = await buildMatchInsights({
      teamA: match.teamA,
      teamB: match.teamB,
      round: match.round,
      kickoff: match.kickoff,
    })

    return NextResponse.json({ insights })
  } catch (error: any) {
    console.error("Match Insights Error:", error)
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi lấy phân tích trận đấu" },
      { status: 500 }
    )
  }
}
