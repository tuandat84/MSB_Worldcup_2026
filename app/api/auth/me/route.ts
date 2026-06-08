import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    
    if (!user) {
      return NextResponse.json(
        { error: "Chưa đăng nhập hoặc phiên làm việc hết hạn" },
        { status: 401 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Auth Me Error:", error)
    return NextResponse.json(
      { error: "Có lỗi hệ thống xảy ra" },
      { status: 500 }
    )
  }
}
