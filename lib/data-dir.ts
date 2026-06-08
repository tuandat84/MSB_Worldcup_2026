import fs from "fs"
import path from "path"

/** Thư mục lưu dữ liệu bền (Railway volume). Mặc định: thư mục project khi dev local */
export function getDataDir(): string {
  return process.env.DATA_DIR || process.cwd()
}

export function getDbPath(): string {
  return path.join(getDataDir(), "worldcup.db")
}

/** Thư mục lưu avatar upload */
export function getAvatarsDir(): string {
  const dir =
    process.env.DATA_DIR != null
      ? path.join(getDataDir(), "uploads", "avatars")
      : path.join(process.cwd(), "public", "uploads", "avatars")

  fs.mkdirSync(dir, { recursive: true })
  return dir
}

/** URL public để hiển thị avatar */
export function getAvatarPublicUrl(fileName: string): string {
  if (process.env.DATA_DIR != null) {
    return `/api/uploads/avatars/${fileName}`
  }
  return `/uploads/avatars/${fileName}`
}

export function resolveAvatarFilePath(avatarUrl: string): string | null {
  if (avatarUrl.startsWith("/uploads/avatars/")) {
    return path.join(process.cwd(), "public", avatarUrl)
  }
  if (avatarUrl.startsWith("/api/uploads/avatars/")) {
    const fileName = path.basename(avatarUrl)
    return path.join(getAvatarsDir(), fileName)
  }
  return null
}
