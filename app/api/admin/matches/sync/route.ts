import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { getPendingManualMatches, syncMatchResults } from "@/lib/match-sync"

export const dynamic = "force-dynamic"

/** Admin kích hoạt đồng bộ kết quả ngay lập tức */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Bạn không có quyền thực hiện hành động này" },
        { status: 403 }
      )
    }

    const db = await getDb()
    const report = await syncMatchResults(db, { force: true })
    const pendingManual = await getPendingManualMatches(db)

    return NextResponse.json({
      message:
        report.updated > 0
          ? `Đã tự động cập nhật ${report.updated} trận và tính điểm.`
          : "Không có trận mới cần cập nhật.",
      report,
      pendingManual,
    })
  } catch (error: unknown) {
    console.error("Admin sync error:", error)
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi đồng bộ kết quả" },
      { status: 500 }
    )
  }
}
