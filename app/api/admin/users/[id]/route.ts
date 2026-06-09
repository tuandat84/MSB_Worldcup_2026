import fs from "fs"
import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { resolveAvatarFilePath } from "@/lib/data-dir"

async function requireAdmin(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user || user.role !== "admin") {
    return null
  }
  return user
}

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req)
    if (!admin) {
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

    const body = await req.json()
    const { locked, hidden } = body

    if (typeof locked !== "boolean" && typeof hidden !== "boolean") {
      return NextResponse.json(
        { error: "Cần trường locked hoặc hidden (true/false)" },
        { status: 400 }
      )
    }

    const db = await getDb()
    const target = await db.get(
      "SELECT id, role FROM users WHERE id = ?",
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
        { error: "Không thể thay đổi tài khoản quản trị" },
        { status: 400 }
      )
    }

    const updates: string[] = []
    const values: (number | string)[] = []
    const response: { isLocked?: boolean; isHidden?: boolean } = {}

    if (typeof locked === "boolean") {
      updates.push("is_locked = ?")
      values.push(locked ? 1 : 0)
      response.isLocked = locked
    }
    if (typeof hidden === "boolean") {
      updates.push("is_hidden = ?")
      values.push(hidden ? 1 : 0)
      response.isHidden = hidden
    }

    values.push(userId)
    await db.run(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      values
    )

    let message = "Đã cập nhật tài khoản"
    if (typeof locked === "boolean" && typeof hidden !== "boolean") {
      message = locked ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản"
    } else if (typeof hidden === "boolean" && typeof locked !== "boolean") {
      message = hidden
        ? "Đã ẩn khỏi bảng xếp hạng"
        : "Đã hiển thị trên bảng xếp hạng"
    }

    return NextResponse.json({ message, ...response })
  } catch (error: unknown) {
    console.error("Admin lock user error:", error)
    return NextResponse.json(
      { error: "Không thể cập nhật trạng thái tài khoản" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req)
    if (!admin) {
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

    const db = await getDb()
    const target = await db.get(
      "SELECT id, role, avatar FROM users WHERE id = ?",
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
        { error: "Không thể xóa tài khoản quản trị" },
        { status: 400 }
      )
    }

    if (target.avatar) {
      const avatarPath = resolveAvatarFilePath(target.avatar)
      if (avatarPath && fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath)
      }
    }

    await db.run("DELETE FROM users WHERE id = ?", [userId])

    return NextResponse.json({ message: "Đã xóa người chơi" })
  } catch (error: unknown) {
    console.error("Admin delete user error:", error)
    return NextResponse.json(
      { error: "Không thể xóa người chơi" },
      { status: 500 }
    )
  }
}
