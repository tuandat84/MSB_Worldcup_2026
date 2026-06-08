import sqlite3 from "sqlite3"
import { open, Database } from "sqlite"
import path from "path"
import bcrypt from "bcryptjs"
import { buildGroupStageSchedule } from "./schedule"
import { backfillMissedPenalties } from "./match-scoring"

let dbInstance: Database<sqlite3.Database, sqlite3.Statement> | null = null
let isInitialized = false

export async function getDb(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
  if (dbInstance) {
    return dbInstance
  }

  const dbPath = path.join(process.cwd(), "worldcup.db")
  
  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database
  })

  // Bật foreign keys
  await dbInstance.run("PRAGMA foreign_keys = ON;")

  if (!isInitialized) {
    isInitialized = true
    await initDb()
  }

  return dbInstance
}

export async function initDb() {
  const db = await getDb()

  // 1. Tạo bảng users
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      fullname TEXT NOT NULL,
      nickname TEXT NOT NULL,
      avatar TEXT,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // 2. Tạo bảng matches
  await db.exec(`
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      round TEXT NOT NULL,
      team_a TEXT NOT NULL,
      team_b TEXT NOT NULL,
      kickoff DATETIME NOT NULL,
      score_a INTEGER DEFAULT NULL,
      score_b INTEGER DEFAULT NULL,
      status TEXT DEFAULT 'open' -- 'open', 'locked', 'finished'
    );
  `)

  // 3. Tạo bảng predictions
  await db.exec(`
    CREATE TABLE IF NOT EXISTS predictions (
      user_id INTEGER NOT NULL,
      match_id INTEGER NOT NULL,
      predicted_score_a INTEGER NOT NULL,
      predicted_score_b INTEGER NOT NULL,
      points INTEGER DEFAULT NULL,
      is_missed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, match_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
    );
  `)

  await migratePredictionsSchema(db)

  // 4. Tạo tài khoản admin mặc định nếu chưa tồn tại
  const adminEmail = "admin@example.com"
  const adminUser = await db.get("SELECT id FROM users WHERE email = ?", [adminEmail])
  
  if (!adminUser) {
    const passwordHash = await bcrypt.hash("admin123", 10)
    await db.run(
      `INSERT INTO users (email, password, fullname, nickname, role) 
       VALUES (?, ?, ?, ?, ?)`,
      [adminEmail, passwordHash, "Admin WC", "admin", "admin"]
    )
    console.log("Admin account created: admin@example.com / admin123")
  }

  // 5. Chèn 72 trận đấu vòng bảng nếu chưa có trận đấu nào
  const matchCount = await db.get("SELECT COUNT(*) as count FROM matches")
  if (matchCount && matchCount.count === 0) {
    console.log("Seeding 72 group stage matches (giờ VN GMT+7)...")
    const schedule = buildGroupStageSchedule()
    for (const m of schedule) {
      await db.run(
        `INSERT INTO matches (round, team_a, team_b, kickoff, status) VALUES (?, ?, ?, ?, ?)`,
        [m.round, m.teamA, m.teamB, m.kickoff, "open"]
      )
    }
    console.log("Successfully seeded 72 matches.")
  } else if (matchCount && matchCount.count > 0) {
    await replaceGroupStageSchedule(db)
  }

  await backfillMissedPenalties(db)
}

async function migratePredictionsSchema(
  db: Database<sqlite3.Database, sqlite3.Statement>
) {
  const columns = (await db.all("PRAGMA table_info(predictions)")) as Array<{
    name: string
  }>
  const hasMissed = columns.some((c) => c.name === "is_missed")
  if (!hasMissed) {
    await db.run("ALTER TABLE predictions ADD COLUMN is_missed INTEGER DEFAULT 0")
    console.log("Đã thêm cột is_missed vào bảng predictions.")
  }
}

/** Thay toàn bộ 72 trận vòng bảng theo lịch FIFA chính thức */
async function replaceGroupStageSchedule(db: Database<sqlite3.Database, sqlite3.Statement>) {
  const schedule = buildGroupStageSchedule()
  const existing = await db.all("SELECT id, team_a, team_b, round, kickoff FROM matches")

  // Kiểm tra trận mở màn Mexico vs Nam Phi (FIFA: 12/6 02:00 VN)
  const anchor = schedule.find((s) => s.teamA === "Mexico" && s.teamB === "South Africa")
  const currentAnchor = existing.find((r) => r.team_a === "Mexico" && r.team_b === "South Korea")

  const needsFullReplace =
    existing.length !== 72 ||
    !anchor ||
    (currentAnchor && currentAnchor.team_b !== "South Africa") ||
    existing.some((row) => {
      const fixture = schedule.find(
        (s) => s.teamA === row.team_a && s.teamB === row.team_b && s.round === row.round
      )
      return !fixture || fixture.kickoff !== row.kickoff
    })

  if (!needsFullReplace) return

  console.log("Đang cập nhật lịch thi đấu 72 trận theo FIFA (giờ VN)...")

  await db.run("BEGIN TRANSACTION")
  try {
    // Xóa dự đoán cũ (cặp đấu đã thay đổi)
    await db.run("DELETE FROM predictions")
    await db.run("DELETE FROM matches")

    for (const m of schedule) {
      await db.run(
        `INSERT INTO matches (round, team_a, team_b, kickoff, status) VALUES (?, ?, ?, ?, ?)`,
        [m.round, m.teamA, m.teamB, m.kickoff, "open"]
      )
    }
    await db.run("COMMIT")
    console.log(`Đã cập nhật ${schedule.length} trận vòng bảng World Cup 2026.`)
  } catch (err) {
    await db.run("ROLLBACK")
    throw err
  }
}
