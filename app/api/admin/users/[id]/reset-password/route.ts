import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getUserFromRequest } from "@/lib/auth"
import { getDb } from "@/lib/db"

const MIN_PASSWORD_LENGTH = 6

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getUserFromRequest(req)
    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { error: "Bạn không có quyền thực hiện hành động này" },
        { status: 403 }
      )
    }

    const params = await props.params
    const userId = parseInt(params.id, 10)
    if (isNaN(userId)) {
      return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 })
    }

    const { newPassword } = await req.json()
    if (!newPassword || typeof newPassword !== "string") {
      return NextResponse.json(
        { error: "Vui lòng nhập mật khẩu mới" },
        { status: 400 }
      )
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Mật khẩu mới phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự` },
        { status: 400 }
      )
    }

    const db = await getDb()
    const target = await db.get(
      "SELECT id, role, nickname FROM users WHERE id = ?",
      [userId]
    )

    if (!target) {
      return NextResponse.json(
        { error: "Người chơi không tồn tại" },
        { status: 404 }
      )
    }

    if (target.role === "admin") {
      return NextResponse.json(
        { error: "Không thể reset mật khẩu tài khoản quản trị" },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await db.run("UPDATE users SET password = ? WHERE id = ?", [
      passwordHash,
      userId,
    ])

    return NextResponse.json({
      message: `Đã reset mật khẩu cho ${target.nickname}`,
    })
  } catch (error: unknown) {
    console.error("Admin reset password error:", error)
    return NextResponse.json(
      { error: "Không thể reset mật khẩu" },
      { status: 500 }
    )
  }
}
