import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { syncMatchResults } from "@/lib/match-sync"
// import { FEE_WRONG_BOTH, FEE_WRONG_ONE } from "@/lib/pool-fee"
import { POINT_EXACT } from "@/lib/match-scoring"

export async function GET(req: NextRequest) {
  try {
    const db = await getDb()

    try {
      await syncMatchResults(db)
    } catch (syncErr) {
      console.error("Leaderboard sync failed:", syncErr)
    }

    // const sort = req.nextUrl.searchParams.get("sort") === "fee" ? "fee" : "points"
    const sort = "points"

    const orderBy = "totalPoints DESC, correctPredictions DESC, u.fullname ASC"
    // sort === "fee"
    //   ? "totalFee DESC, totalPoints DESC, u.fullname ASC"
    //   : "totalPoints DESC, correctPredictions DESC, u.fullname ASC"

    const leaderboard = await db.all(`
      SELECT 
        u.id, 
        u.fullname as name, 
        u.nickname,
        u.avatar,
        COALESCE(SUM(p.points), 0) as totalPoints,
        COALESCE(SUM(CASE WHEN p.points = ${POINT_EXACT} THEN 1 ELSE 0 END), 0) as correctPredictions,
        COALESCE(SUM(CASE WHEN p.points IS NOT NULL THEN 1 ELSE 0 END), 0) as totalPredictions
      FROM users u
      LEFT JOIN predictions p ON u.id = p.user_id
      WHERE u.role != 'admin' AND COALESCE(u.is_hidden, 0) = 0
      GROUP BY u.id
      ORDER BY ${orderBy}
    `)
    /*
    const leaderboardWithFee = await db.all(`
      SELECT 
        ...
        COALESCE(SUM(
          CASE
            WHEN p.is_missed = 1 OR p.points = 0 THEN ${FEE_WRONG_BOTH}
            WHEN p.points = 1 THEN ${FEE_WRONG_ONE}
            ELSE 0
          END
        ), 0) as totalFee
      ...
    `)

    const poolRow = await db.get<{ poolTotal: number }>(`
      SELECT COALESCE(SUM(
        CASE
          WHEN p.is_missed = 1 OR p.points = 0 THEN ${FEE_WRONG_BOTH}
          WHEN p.points = 1 THEN ${FEE_WRONG_ONE}
          ELSE 0
        END
      ), 0) as poolTotal
      FROM predictions p
      JOIN users u ON p.user_id = u.id
      WHERE u.role != 'admin' AND COALESCE(u.is_hidden, 0) = 0 AND p.points IS NOT NULL
    `)
    */

    return NextResponse.json({
      leaderboard,
      // poolTotal: poolRow?.poolTotal ?? 0,
      sort,
    })
  } catch (error: any) {
    console.error("Leaderboard Error:", error)
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi lấy bảng xếp hạng" },
      { status: 500 }
    )
  }
}
