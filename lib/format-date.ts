const TZ = "Asia/Ho_Chi_Minh"

/** Parse kickoff luôn theo UTC (tránh SQLite trả về chuỗi không có Z bị hiểu nhầm giờ local) */
export function parseKickoff(dateStr: string): Date {
  if (!dateStr) return new Date(NaN)
  const s = dateStr.trim()
  if (/[Zz]$/.test(s) || /[+-]\d{2}:\d{2}$/.test(s)) return new Date(s)
  const normalized = s.includes("T") ? s : s.replace(" ", "T")
  return new Date(normalized.endsWith("Z") ? normalized : `${normalized}Z`)
}

export function formatKickoffDate(dateStr: string): string {
  return parseKickoff(dateStr).toLocaleDateString("vi-VN", {
    timeZone: TZ,
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatDateHeader(dateStr: string): string {
  const d = parseKickoff(dateStr)
  const weekday = d.toLocaleDateString("vi-VN", { timeZone: TZ, weekday: "long" })
  const date = d.toLocaleDateString("vi-VN", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${date}`
}

export function formatTime(dateStr: string): string {
  return parseKickoff(dateStr).toLocaleTimeString("vi-VN", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatShortDate(dateStr: string): string {
  return parseKickoff(dateStr).toLocaleDateString("vi-VN", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/** Trả về YYYY-MM-DD theo giờ Việt Nam (để nhóm theo ngày) */
export function toVNDateKey(dateStr: string): string {
  return parseKickoff(dateStr).toLocaleDateString("sv-SE", { timeZone: TZ })
}

export function formatJoinDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}
