import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { applyMatchResult } from "@/lib/match-scoring"

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params
    const matchId = parseInt(params.id, 10)

    const user = await getUserFromRequest(req)
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Bạn không có quyền thực hiện hành động này" },
        { status: 403 }
      )
    }

    const { scoreA, scoreB } = await req.json()

    if (scoreA === undefined || scoreB === undefined) {
      return NextResponse.json(
        { error: "Vui lòng nhập tỷ số thực tế của trận đấu" },
        { status: 400 }
      )
    }

    const sA = parseInt(scoreA, 10)
    const sB = parseInt(scoreB, 10)
    if (isNaN(sA) || isNaN(sB) || sA < 0 || sB < 0) {
      return NextResponse.json(
        { error: "Tỷ số nhập vào không hợp lệ" },
        { status: 400 }
      )
    }

    const db = await getDb()

    const match = await db.get("SELECT id FROM matches WHERE id = ?", [matchId])
    if (!match) {
      return NextResponse.json(
        { error: "Trận đấu không tồn tại" },
        { status: 404 }
      )
    }

    await applyMatchResult(db, matchId, sA, sB)

    return NextResponse.json({
      message: "Cập nhật tỷ số trận đấu và tính điểm thành công!",
    })
  } catch (error: unknown) {
    console.error("Admin Update Match Error:", error)
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi cập nhật kết quả trận đấu" },
      { status: 500 }
    )
  }
}
