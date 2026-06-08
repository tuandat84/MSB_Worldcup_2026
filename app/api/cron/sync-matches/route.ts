import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { syncMatchResults } from "@/lib/match-sync"

export const dynamic = "force-dynamic"

/** Cron job: tự động cập nhật kết quả & tính điểm (gọi mỗi 2 giờ) */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const db = await getDb()
    const report = await syncMatchResults(db, { force: true })
    return NextResponse.json({ ok: true, ...report })
  } catch (error: unknown) {
    console.error("Cron sync error:", error)
    return NextResponse.json(
      { error: "Đồng bộ kết quả thất bại" },
      { status: 500 }
    )
  }
}
