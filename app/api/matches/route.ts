import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { syncMatchResults } from "@/lib/match-sync"
import { calculatePoolFee } from "@/lib/pool-fee"

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json(
        { error: "Chưa đăng nhập hoặc phiên làm việc hết hạn" },
        { status: 401 }
      )
    }

    const db = await getDb()

    // Tự động khóa trận đã bắt đầu & cập nhật kết quả (cooldown 2 giờ)
    try {
      await syncMatchResults(db)
    } catch (syncErr) {
      console.error("Background match sync failed:", syncErr)
    }

    // Lấy toàn bộ danh sách trận đấu kèm theo dự đoán của người dùng hiện tại (nếu có)
    const matches = await db.all(`
      SELECT 
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
        p.points as pointsAwarded,
        COALESCE(p.is_missed, 0) as isMissed
      FROM matches m
      LEFT JOIN predictions p ON m.id = p.match_id AND p.user_id = ?
      ORDER BY m.kickoff ASC, m.id ASC
    `, [user.id])

    const matchesWithFee = matches.map(
      (m: {
        status: string
        pointsAwarded: number | null
        isMissed: number
        predictedScoreA: number | null
        predictedScoreB: number | null
      }) => ({
        ...m,
        isMissed: m.isMissed === 1,
        poolFee:
          m.status === "finished"
            ? calculatePoolFee(m.pointsAwarded, m.isMissed === 1)
            : 0,
      })
    )

    return NextResponse.json({ matches: matchesWithFee })
  } catch (error: any) {
    console.error("Get Matches Error:", error)
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi lấy danh sách trận đấu" },
      { status: 500 }
    )
  }
}
