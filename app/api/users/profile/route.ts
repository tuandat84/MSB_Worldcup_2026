import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { MAX_AVATAR_UPLOAD_BYTES } from "@/lib/resize-image"
import fs from "fs"
import path from "path"

export async function PUT(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json(
        { error: "Chưa đăng nhập hoặc phiên làm việc hết hạn" },
        { status: 401 }
      )
    }

    const { fullname, nickname, avatar } = await req.json()

    if (!fullname || !nickname) {
      return NextResponse.json(
        { error: "Tên đầy đủ và nickname không được để trống" },
        { status: 400 }
      )
    }

    const db = await getDb()
    let avatarUrl = user.avatar

    // Nếu người dùng tải lên avatar mới (dạng base64)
    if (avatar && avatar.startsWith("data:image/")) {
      const match = avatar.match(/^data:image\/(\w+);base64,/)
      if (!match) {
        return NextResponse.json(
          { error: "Định dạng ảnh không hợp lệ" },
          { status: 400 }
        )
      }

      const mimeType = match[1].toLowerCase()
      const allowed = new Set(["jpeg", "jpg", "png", "webp", "gif"])
      if (!allowed.has(mimeType)) {
        return NextResponse.json(
          { error: "Chỉ chấp nhận ảnh JPG, PNG, WebP hoặc GIF" },
          { status: 400 }
        )
      }

      const base64Data = avatar.replace(/^data:image\/\w+;base64,/, "")
      const buffer = Buffer.from(base64Data, "base64")

      if (buffer.length > MAX_AVATAR_UPLOAD_BYTES) {
        return NextResponse.json(
          { error: "Ảnh sau resize vẫn quá lớn. Vui lòng chọn ảnh khác." },
          { status: 400 }
        )
      }

      const fileExtension = mimeType === "jpeg" ? "jpg" : mimeType

      // Tạo thư mục public/uploads/avatars nếu chưa có
      const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars")
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      const fileName = `avatar-${user.id}-${Date.now()}.${fileExtension}`
      const filePath = path.join(uploadDir, fileName)

      // Ghi file ảnh ra đĩa
      fs.writeFileSync(filePath, buffer)
      avatarUrl = `/uploads/avatars/${fileName}`

      // Xóa ảnh cũ nếu có và khác mặc định
      if (user.avatar && user.avatar.startsWith("/uploads/avatars/")) {
        const oldFilePath = path.join(process.cwd(), "public", user.avatar)
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath)
          } catch (err) {
            console.error("Lỗi xóa avatar cũ:", err)
          }
        }
      }
    }

    // Cập nhật CSDL
    await db.run(
      `UPDATE users 
       SET fullname = ?, nickname = ?, avatar = ? 
       WHERE id = ?`,
      [fullname, nickname, avatarUrl, user.id]
    )

    // Lấy thông tin user đã cập nhật
    const updatedUser = await db.get(
      "SELECT id, email, fullname, nickname, avatar, role FROM users WHERE id = ?",
      [user.id]
    )

    return NextResponse.json({
      message: "Cập nhật thông tin thành công!",
      user: updatedUser
    })
  } catch (error: any) {
    console.error("Update Profile Error:", error)
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi cập nhật hồ sơ" },
      { status: 500 }
    )
  }
}
