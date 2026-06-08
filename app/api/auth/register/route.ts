import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullname, nickname } = await req.json()

    if (!email || !password || !fullname || !nickname) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ thông tin bắt buộc" },
        { status: 400 }
      )
    }

    const db = await getDb()

    // Kiểm tra email trùng
    const existingUser = await db.get("SELECT id FROM users WHERE email = ?", [email])
    if (existingUser) {
      return NextResponse.json(
        { error: "Email này đã được đăng ký sử dụng" },
        { status: 400 }
      )
    }

    // Băm mật khẩu
    const passwordHash = await bcrypt.hash(password, 10)

    // Thêm người dùng mới
    const result = await db.run(
      `INSERT INTO users (email, password, fullname, nickname, role) 
       VALUES (?, ?, ?, ?, ?)`,
      [email, passwordHash, fullname, nickname, "user"]
    )

    return NextResponse.json(
      { message: "Đăng ký thành công!", userId: result.lastID },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Register Error:", error)
    return NextResponse.json(
      { error: "Có lỗi xảy ra trong quá trình đăng ký" },
      { status: 500 }
    )
  }
}
