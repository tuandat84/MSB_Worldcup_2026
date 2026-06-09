import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getUserFromRequest } from "@/lib/auth"
import { getDb } from "@/lib/db"

const MIN_PASSWORD_LENGTH = 6

export async function PUT(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json(
        { error: "Chưa đăng nhập hoặc phiên làm việc hết hạn" },
        { status: 401 }
      )
    }

    const { currentPassword, newPassword } = await req.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới" },
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
    const row = await db.get<{ password: string }>(
      "SELECT password FROM users WHERE id = ?",
      [user.id]
    )

    if (!row) {
      return NextResponse.json({ error: "Tài khoản không tồn tại" }, { status: 404 })
    }

    const valid = await bcrypt.compare(currentPassword, row.password)
    if (!valid) {
      return NextResponse.json(
        { error: "Mật khẩu hiện tại không chính xác" },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await db.run("UPDATE users SET password = ? WHERE id = ?", [
      passwordHash,
      user.id,
    ])

    return NextResponse.json({ message: "Đổi mật khẩu thành công!" })
  } catch (error: unknown) {
    console.error("Change password error:", error)
    return NextResponse.json(
      { error: "Không thể đổi mật khẩu" },
      { status: 500 }
    )
  }
}
