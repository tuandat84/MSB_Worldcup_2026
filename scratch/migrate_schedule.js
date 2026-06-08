/**
 * Cập nhật 72 trận vòng bảng WC 2026 theo lịch FIFA/ESPN (kickoff ET → UTC)
 * Chạy: node scratch/migrate_schedule.js
 */
const sqlite3 = require("sqlite3")
const { open } = require("sqlite")
const path = require("path")

const pad = (n) => String(n).padStart(2, "0")
const et = (y, m, d, h, min = 0) =>
  new Date(`${y}-${pad(m)}-${pad(d)}T${pad(h)}:${pad(min)}:00-04:00`).toISOString()

const SCHEDULE = [
  ["Bảng A - Lượt 1", "Mexico", "South Africa", et(2026, 6, 11, 15, 0)],
  ["Bảng A - Lượt 1", "South Korea", "Czechia", et(2026, 6, 11, 22, 0)],
  ["Bảng A - Lượt 2", "Czechia", "South Africa", et(2026, 6, 18, 12, 0)],
  ["Bảng A - Lượt 2", "Mexico", "South Korea", et(2026, 6, 18, 23, 0)],
  ["Bảng A - Lượt 3", "Czechia", "Mexico", et(2026, 6, 24, 21, 0)],
  ["Bảng A - Lượt 3", "South Africa", "South Korea", et(2026, 6, 24, 21, 0)],
  ["Bảng B - Lượt 1", "Canada", "Bosnia and Herzegovina", et(2026, 6, 12, 15, 0)],
  ["Bảng B - Lượt 1", "Qatar", "Switzerland", et(2026, 6, 13, 15, 0)],
  ["Bảng B - Lượt 2", "Switzerland", "Bosnia and Herzegovina", et(2026, 6, 18, 15, 0)],
  ["Bảng B - Lượt 2", "Canada", "Qatar", et(2026, 6, 18, 18, 0)],
  ["Bảng B - Lượt 3", "Switzerland", "Canada", et(2026, 6, 24, 15, 0)],
  ["Bảng B - Lượt 3", "Bosnia and Herzegovina", "Qatar", et(2026, 6, 24, 15, 0)],
  ["Bảng C - Lượt 1", "Brazil", "Morocco", et(2026, 6, 13, 18, 0)],
  ["Bảng C - Lượt 1", "Haiti", "Scotland", et(2026, 6, 13, 21, 0)],
  ["Bảng C - Lượt 2", "Scotland", "Morocco", et(2026, 6, 19, 18, 0)],
  ["Bảng C - Lượt 2", "Brazil", "Haiti", et(2026, 6, 19, 21, 0)],
  ["Bảng C - Lượt 3", "Scotland", "Brazil", et(2026, 6, 24, 18, 0)],
  ["Bảng C - Lượt 3", "Morocco", "Haiti", et(2026, 6, 24, 18, 0)],
  ["Bảng D - Lượt 1", "USA", "Paraguay", et(2026, 6, 12, 21, 0)],
  ["Bảng D - Lượt 1", "Australia", "Turkiye", et(2026, 6, 14, 0, 0)],
  ["Bảng D - Lượt 2", "USA", "Australia", et(2026, 6, 19, 15, 0)],
  ["Bảng D - Lượt 2", "Turkiye", "Paraguay", et(2026, 6, 20, 0, 0)],
  ["Bảng D - Lượt 3", "Turkiye", "USA", et(2026, 6, 25, 22, 0)],
  ["Bảng D - Lượt 3", "Paraguay", "Australia", et(2026, 6, 25, 22, 0)],
  ["Bảng E - Lượt 1", "Germany", "Curacao", et(2026, 6, 14, 13, 0)],
  ["Bảng E - Lượt 1", "Ivory Coast", "Ecuador", et(2026, 6, 14, 19, 0)],
  ["Bảng E - Lượt 2", "Germany", "Ivory Coast", et(2026, 6, 20, 16, 0)],
  ["Bảng E - Lượt 2", "Ecuador", "Curacao", et(2026, 6, 20, 20, 0)],
  ["Bảng E - Lượt 3", "Ecuador", "Germany", et(2026, 6, 25, 16, 0)],
  ["Bảng E - Lượt 3", "Curacao", "Ivory Coast", et(2026, 6, 25, 16, 0)],
  ["Bảng F - Lượt 1", "Netherlands", "Japan", et(2026, 6, 14, 16, 0)],
  ["Bảng F - Lượt 1", "Sweden", "Tunisia", et(2026, 6, 14, 22, 0)],
  ["Bảng F - Lượt 2", "Netherlands", "Sweden", et(2026, 6, 20, 13, 0)],
  ["Bảng F - Lượt 2", "Tunisia", "Japan", et(2026, 6, 21, 0, 0)],
  ["Bảng F - Lượt 3", "Japan", "Sweden", et(2026, 6, 25, 19, 0)],
  ["Bảng F - Lượt 3", "Tunisia", "Netherlands", et(2026, 6, 25, 19, 0)],
  ["Bảng G - Lượt 1", "Belgium", "Egypt", et(2026, 6, 15, 18, 0)],
  ["Bảng G - Lượt 1", "Iran", "New Zealand", et(2026, 6, 16, 0, 0)],
  ["Bảng G - Lượt 2", "Belgium", "Iran", et(2026, 6, 21, 15, 0)],
  ["Bảng G - Lượt 2", "New Zealand", "Egypt", et(2026, 6, 21, 21, 0)],
  ["Bảng G - Lượt 3", "Egypt", "Iran", et(2026, 6, 26, 23, 0)],
  ["Bảng G - Lượt 3", "New Zealand", "Belgium", et(2026, 6, 26, 23, 0)],
  ["Bảng H - Lượt 1", "Spain", "Cape Verde", et(2026, 6, 15, 12, 0)],
  ["Bảng H - Lượt 1", "Saudi Arabia", "Uruguay", et(2026, 6, 15, 18, 0)],
  ["Bảng H - Lượt 2", "Spain", "Saudi Arabia", et(2026, 6, 21, 12, 0)],
  ["Bảng H - Lượt 2", "Uruguay", "Cape Verde", et(2026, 6, 21, 18, 0)],
  ["Bảng H - Lượt 3", "Cape Verde", "Saudi Arabia", et(2026, 6, 26, 20, 0)],
  ["Bảng H - Lượt 3", "Uruguay", "Spain", et(2026, 6, 26, 20, 0)],
  ["Bảng I - Lượt 1", "France", "Senegal", et(2026, 6, 16, 15, 0)],
  ["Bảng I - Lượt 1", "Iraq", "Norway", et(2026, 6, 16, 18, 0)],
  ["Bảng I - Lượt 2", "France", "Iraq", et(2026, 6, 22, 17, 0)],
  ["Bảng I - Lượt 2", "Norway", "Senegal", et(2026, 6, 22, 20, 0)],
  ["Bảng I - Lượt 3", "Norway", "France", et(2026, 6, 26, 15, 0)],
  ["Bảng I - Lượt 3", "Senegal", "Iraq", et(2026, 6, 26, 15, 0)],
  ["Bảng J - Lượt 1", "Argentina", "Algeria", et(2026, 6, 16, 21, 0)],
  ["Bảng J - Lượt 1", "Austria", "Jordan", et(2026, 6, 17, 0, 0)],
  ["Bảng J - Lượt 2", "Argentina", "Austria", et(2026, 6, 22, 13, 0)],
  ["Bảng J - Lượt 2", "Jordan", "Algeria", et(2026, 6, 22, 23, 0)],
  ["Bảng J - Lượt 3", "Algeria", "Austria", et(2026, 6, 27, 22, 0)],
  ["Bảng J - Lượt 3", "Jordan", "Argentina", et(2026, 6, 27, 22, 0)],
  ["Bảng K - Lượt 1", "Portugal", "DR Congo", et(2026, 6, 17, 13, 0)],
  ["Bảng K - Lượt 1", "Uzbekistan", "Colombia", et(2026, 6, 17, 22, 0)],
  ["Bảng K - Lượt 2", "Portugal", "Uzbekistan", et(2026, 6, 23, 13, 0)],
  ["Bảng K - Lượt 2", "Colombia", "DR Congo", et(2026, 6, 23, 22, 0)],
  ["Bảng K - Lượt 3", "Colombia", "Portugal", et(2026, 6, 27, 19, 30)],
  ["Bảng K - Lượt 3", "DR Congo", "Uzbekistan", et(2026, 6, 27, 19, 30)],
  ["Bảng L - Lượt 1", "England", "Croatia", et(2026, 6, 17, 16, 0)],
  ["Bảng L - Lượt 1", "Ghana", "Panama", et(2026, 6, 17, 19, 0)],
  ["Bảng L - Lượt 2", "England", "Ghana", et(2026, 6, 23, 16, 0)],
  ["Bảng L - Lượt 2", "Panama", "Croatia", et(2026, 6, 23, 19, 0)],
  ["Bảng L - Lượt 3", "Panama", "England", et(2026, 6, 27, 17, 0)],
  ["Bảng L - Lượt 3", "Croatia", "Ghana", et(2026, 6, 27, 17, 0)],
]

async function main() {
  const dbPath = path.join(__dirname, "..", "worldcup.db")
  const db = await open({ filename: dbPath, driver: sqlite3.Database })
  await db.run("PRAGMA foreign_keys = ON")

  console.log("Đang cập nhật lịch thi đấu 72 trận theo FIFA...")
  await db.run("BEGIN TRANSACTION")
  try {
    await db.run("DELETE FROM predictions")
    await db.run("DELETE FROM matches")
    for (const [round, teamA, teamB, kickoff] of SCHEDULE) {
      await db.run(
        "INSERT INTO matches (round, team_a, team_b, kickoff, status) VALUES (?, ?, ?, ?, ?)",
        [round, teamA, teamB, kickoff, "open"]
      )
    }
    await db.run("COMMIT")
    console.log(`Đã cập nhật ${SCHEDULE.length} trận.`)
  } catch (err) {
    await db.run("ROLLBACK")
    throw err
  }

  const opener = await db.get(
    "SELECT kickoff FROM matches WHERE team_a='Mexico' AND team_b='South Africa'"
  )
  const vn = new Date(opener.kickoff).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "short",
    timeStyle: "short",
  })
  console.log(`Trận khai mạc Mexico vs Nam Phi: ${vn} (giờ VN)`)

  await db.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
