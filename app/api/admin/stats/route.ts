import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { getPendingManualMatches, syncMatchResults } from "@/lib/match-sync"

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Bạn không có quyền thực hiện hành động này" },
        { status: 403 }
      )
    }

    const db = await getDb()

    try {
      await syncMatchResults(db)
    } catch (syncErr) {
      console.error("Admin stats sync failed:", syncErr)
    }

    const userCount = await db.get("SELECT COUNT(*) as count FROM users WHERE role != 'admin'")
    const predictionCount = await db.get("SELECT COUNT(*) as count FROM predictions")
    const finishedMatchCount = await db.get("SELECT COUNT(*) as count FROM matches WHERE status = 'finished'")
    const pendingManual = await getPendingManualMatches(db)

    return NextResponse.json({
      stats: {
        totalPlayers: userCount?.count || 0,
        totalPredictions: predictionCount?.count || 0,
        finishedMatches: finishedMatchCount?.count || 0,
        pendingManual: pendingManual.length,
      },
      pendingManual,
    })
  } catch (error: any) {
    console.error("Admin Stats Error:", error)
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi lấy số liệu thống kê" },
      { status: 500 }
    )
  }
}
