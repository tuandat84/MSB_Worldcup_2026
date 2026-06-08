import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { getAvatarsDir } from "@/lib/data-dir"

export const dynamic = "force-dynamic"

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
}

export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ filename: string }> }
) {
  const { filename } = await props.params
  const safeName = path.basename(filename)
  if (safeName !== filename) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const filePath = path.join(getAvatarsDir(), safeName)
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const ext = safeName.split(".").pop()?.toLowerCase() ?? ""
  const buffer = fs.readFileSync(filePath)

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": MIME[ext] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=86400",
    },
  })
}
