const sqlite3 = require("sqlite3")
const { open } = require("sqlite")

async function main() {
  const db = await open({ filename: "worldcup.db", driver: sqlite3.Database })
  const h = await db.all(
    "SELECT id, round, team_a, team_b, kickoff FROM matches WHERE round LIKE 'Bảng H%' ORDER BY kickoff"
  )
  console.log("=== Bảng H trong database ===")
  for (const r of h) {
    const vn = new Date(r.kickoff).toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      dateStyle: "short",
      timeStyle: "short",
    })
    console.log(`${r.round}: ${r.team_a} vs ${r.team_b} — ${vn}`)
  }
  await db.close()
}

main()
