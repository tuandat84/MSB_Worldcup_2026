import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { signToken } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Vui lòng nhập email và mật khẩu" },
        { status: 400 }
      )
    }

    const db = await getDb()

    // Tìm user bằng email
    const user = await db.get(
      `SELECT id, email, password, fullname, nickname, avatar, role,
              COALESCE(is_locked, 0) as is_locked
       FROM users WHERE email = ?`,
      [email]
    )

    if (!user) {
      return NextResponse.json(
        { error: "Tài khoản hoặc mật khẩu không chính xác" },
        { status: 401 }
      )
    }

    if (user.is_locked === 1) {
      return NextResponse.json(
        { error: "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên." },
        { status: 403 }
      )
    }

    // So khớp mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Tài khoản hoặc mật khẩu không chính xác" },
        { status: 401 }
      )
    }

    // Tạo JWT token
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role
    })

    // Tạo response và set cookie HttpOnly
    const response = NextResponse.json({
      message: "Đăng nhập thành công",
      user: {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role
      }
    })

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60, // 7 ngày
      path: "/"
    })

    return response
  } catch (error: any) {
    console.error("Login Error:", error)
    return NextResponse.json(
      { error: "Có lỗi hệ thống xảy ra" },
      { status: 500 }
    )
  }
}
