const sqlite3 = require("sqlite3")
const { open } = require("sqlite")

function parseKickoff(dateStr) {
  const s = dateStr.trim()
  if (/[Zz]$/.test(s) || /[+-]\d{2}:\d{2}$/.test(s)) return new Date(s)
  const normalized = s.includes("T") ? s : s.replace(" ", "T")
  return new Date(normalized.endsWith("Z") ? normalized : `${normalized}Z`)
}

async function main() {
  // Chạy migration
  const { initDb } = require("../lib/db")
  // Can't easily require TS - run migration via schedule directly
  const { buildGroupStageSchedule } = require("../lib/schedule.ts")
}
