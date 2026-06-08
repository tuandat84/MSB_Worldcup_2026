import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    // 1. Xác thực quyền Admin
    const user = await getUserFromRequest(req)
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Bạn không có quyền thực hiện hành động này" },
        { status: 403 }
      )
    }

    const { round, teamA, teamB, kickoff } = await req.json()

    if (!round || !teamA || !teamB || !kickoff) {
      return NextResponse.json(
        { error: "Vui lòng điền đầy đủ thông tin trận đấu" },
        { status: 400 }
      )
    }

    const db = await getDb()

    // Thêm trận đấu mới
    const result = await db.run(
      `INSERT INTO matches (round, team_a, team_b, kickoff, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [round, teamA, teamB, new Date(kickoff).toISOString(), "open"]
    )

    return NextResponse.json({
      message: "Thêm trận đấu thành công!",
      matchId: result.lastID
    }, { status: 201 })
  } catch (error: any) {
    console.error("Admin Create Match Error:", error)
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi tạo trận đấu" },
      { status: 500 }
    )
  }
}
