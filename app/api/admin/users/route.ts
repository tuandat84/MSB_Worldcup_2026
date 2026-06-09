import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { getDb } from "@/lib/db"

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
    const players = await db.all(`
      SELECT
        u.id,
        u.email,
        u.fullname,
        u.nickname,
        u.avatar,
        u.created_at as createdAt,
        COALESCE(u.is_locked, 0) as isLocked,
        COALESCE(u.is_hidden, 0) as isHidden,
        COUNT(p.match_id) as totalPredictions
      FROM users u
      LEFT JOIN predictions p ON p.user_id = u.id
      WHERE u.role != 'admin'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `)

    return NextResponse.json({
      players: players.map(
        (p: { isLocked: number; isHidden: number }) => ({
          ...p,
          isLocked: p.isLocked === 1,
          isHidden: p.isHidden === 1,
        })
      ),
    })
  } catch (error: unknown) {
    console.error("Admin list users error:", error)
    return NextResponse.json(
      { error: "Không thể tải danh sách người chơi" },
      { status: 500 }
    )
  }
}
