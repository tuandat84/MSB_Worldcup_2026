import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { parseKickoff } from "@/lib/format-date"

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json(
        { error: "Chưa đăng nhập hoặc phiên làm việc hết hạn" },
        { status: 401 }
      )
    }

    const { matchId, predictedScoreA, predictedScoreB } = await req.json()

    if (matchId === undefined || predictedScoreA === undefined || predictedScoreB === undefined) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ tỷ số dự đoán" },
        { status: 400 }
      )
    }

    // Chuyển sang số nguyên
    const pScoreA = parseInt(predictedScoreA, 10)
    const pScoreB = parseInt(predictedScoreB, 10)
    if (isNaN(pScoreA) || isNaN(pScoreB) || pScoreA < 0 || pScoreB < 0) {
      return NextResponse.json(
        { error: "Tỷ số dự đoán không hợp lệ" },
        { status: 400 }
      )
    }

    const db = await getDb()

    // Lấy thông tin trận đấu để kiểm tra điều kiện
    const match = await db.get("SELECT kickoff, status FROM matches WHERE id = ?", [matchId])
    if (!match) {
      return NextResponse.json(
        { error: "Trận đấu không tồn tại" },
        { status: 404 }
      )
    }

    // Điều kiện 1: Trạng thái trận đấu phải là 'open'
    if (match.status !== "open") {
      return NextResponse.json(
        { error: "Trận đấu này đã khóa dự đoán (đang diễn ra hoặc đã kết thúc)" },
        { status: 400 }
      )
    }

    // Điều kiện 2: Phải trước giờ thi đấu
    const now = new Date()
    const kickoffTime = parseKickoff(match.kickoff)
    if (now >= kickoffTime) {
      // Tự động cập nhật trạng thái trận đấu sang locked luôn nếu nó chưa được khóa
      await db.run("UPDATE matches SET status = 'locked' WHERE id = ?", [matchId])
      return NextResponse.json(
        { error: "Trận đấu đã bắt đầu, không thể dự đoán nữa" },
        { status: 400 }
      )
    }

    // Lưu hoặc Cập nhật dự đoán
    await db.run(
      `INSERT INTO predictions (user_id, match_id, predicted_score_a, predicted_score_b) 
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, match_id) DO UPDATE SET
       predicted_score_a = excluded.predicted_score_a,
       predicted_score_b = excluded.predicted_score_b,
       created_at = CURRENT_TIMESTAMP`,
      [user.id, matchId, pScoreA, pScoreB]
    )

    return NextResponse.json({
      message: "Lưu dự đoán thành công!"
    })
  } catch (error: any) {
    console.error("Save Prediction Error:", error)
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi lưu dự đoán" },
      { status: 500 }
    )
  }
}
