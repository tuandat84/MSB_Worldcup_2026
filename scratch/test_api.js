// Script test nhanh các hàm nghiệp vụ của cơ sở dữ liệu
// Chạy độc lập bằng: node scratch/test_api.js
const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const bcrypt = require("bcryptjs");

async function runTests() {
  console.log("=== BẮT ĐẦU KIỂM THỬ NGHIỆP VỤ DATABASE ===");

  // Sử dụng file test db riêng biệt
  const dbPath = path.join(__dirname, "..", "test_worldcup.db");
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log("Đã xóa database test cũ.");
  }

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.run("PRAGMA foreign_keys = ON;");

  // 1. Tạo bảng
  console.log("\n1. Tạo các bảng dữ liệu...");
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
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      round TEXT NOT NULL,
      team_a TEXT NOT NULL,
      team_b TEXT NOT NULL,
      kickoff DATETIME NOT NULL,
      score_a INTEGER DEFAULT NULL,
      score_b INTEGER DEFAULT NULL,
      status TEXT DEFAULT 'open'
    );
    CREATE TABLE IF NOT EXISTS predictions (
      user_id INTEGER NOT NULL,
      match_id INTEGER NOT NULL,
      predicted_score_a INTEGER NOT NULL,
      predicted_score_b INTEGER NOT NULL,
      points INTEGER DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, match_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
    );
  `);
  console.log("✓ Tạo các bảng thành công.");

  // 2. Tạo users test
  console.log("\n2. Đăng ký thành viên...");
  const hash1 = await bcrypt.hash("password123", 10);
  const hash2 = await bcrypt.hash("password123", 10);

  const u1 = await db.run(
    "INSERT INTO users (email, password, fullname, nickname, role) VALUES (?, ?, ?, ?, ?)",
    ["an@example.com", hash1, "Nguyễn Văn An", "an_predict", "user"]
  );
  const u2 = await db.run(
    "INSERT INTO users (email, password, fullname, nickname, role) VALUES (?, ?, ?, ?, ?)",
    ["binh@example.com", hash2, "Trần Thị Bình", "binh_predict", "user"]
  );
  console.log(`✓ Đã đăng ký An (ID: ${u1.lastID}) và Bình (ID: ${u2.lastID}).`);

  // 3. Thêm trận đấu mẫu
  console.log("\n3. Thêm trận đấu mẫu...");
  const m1 = await db.run(
    "INSERT INTO matches (round, team_a, team_b, kickoff, status) VALUES (?, ?, ?, ?, ?)",
    ["Bảng A - Lượt 1", "Việt Nam", "Thái Lan", new Date().toISOString(), "open"]
  );
  const m2 = await db.run(
    "INSERT INTO matches (round, team_a, team_b, kickoff, status) VALUES (?, ?, ?, ?, ?)",
    ["Bảng A - Lượt 1", "Brazil", "Đức", new Date().toISOString(), "open"]
  );
  console.log(`✓ Đã tạo Trận 1 (VN vs TL, ID: ${m1.lastID}) và Trận 2 (Brazil vs Đức, ID: ${m2.lastID}).`);

  // 4. Tạo dự đoán
  console.log("\n4. Người dùng dự đoán...");
  // An đoán VN thắng 2 - 1, đoán Brazil hòa Đức 2 - 2
  await db.run(
    "INSERT INTO predictions (user_id, match_id, predicted_score_a, predicted_score_b) VALUES (?, ?, ?, ?)",
    [u1.lastID, m1.lastID, 2, 1]
  );
  await db.run(
    "INSERT INTO predictions (user_id, match_id, predicted_score_a, predicted_score_b) VALUES (?, ?, ?, ?)",
    [u1.lastID, m2.lastID, 2, 2]
  );

  // Bình đoán VN thắng 1 - 0, đoán Brazil thua Đức 1 - 3
  await db.run(
    "INSERT INTO predictions (user_id, match_id, predicted_score_a, predicted_score_b) VALUES (?, ?, ?, ?)",
    [u2.lastID, m1.lastID, 1, 0]
  );
  await db.run(
    "INSERT INTO predictions (user_id, match_id, predicted_score_a, predicted_score_b) VALUES (?, ?, ?, ?)",
    [u2.lastID, m2.lastID, 1, 3]
  );
  console.log("✓ Lưu các dự đoán thành công.");

  // 5. Admin cập nhật kết quả & Tự động tính điểm
  console.log("\n5. Admin cập nhật tỷ số thực tế và tính điểm...");
  // Giả sử kết quả thực tế:
  // Trận 1 (VN vs TL): VN thắng 2 - 1 (An đoán 2-1: trúng cả tỷ số -> 2 điểm; Bình đoán 1-0: trúng tính chất -> 1 điểm)
  // Trận 2 (Brazil vs Đức): Brazil hòa Đức 2 - 2 (An đoán 2-2: trúng cả tỷ số -> 2 điểm; Bình đoán 1-3: sai hoàn toàn -> 0 điểm)
  const actualScores = {
    [m1.lastID]: { sA: 2, sB: 1 },
    [m2.lastID]: { sA: 2, sB: 2 }
  };

  for (const matchId of [m1.lastID, m2.lastID]) {
    const { sA, sB } = actualScores[matchId];
    
    // Cập nhật trận đấu
    await db.run(
      "UPDATE matches SET score_a = ?, score_b = ?, status = 'finished' WHERE id = ?",
      [sA, sB, matchId]
    );

    // Tính điểm cho các dự đoán của trận này
    const predictions = await db.all(
      "SELECT user_id, predicted_score_a, predicted_score_b FROM predictions WHERE match_id = ?",
      [matchId]
    );

    const actualOutcome = sA > sB ? "A" : sA === sB ? "D" : "B";

    for (const pred of predictions) {
      const pA = pred.predicted_score_a;
      const pB = pred.predicted_score_b;
      const predictedOutcome = pA > pB ? "A" : pA === pB ? "D" : "B";

      let points = 0;
      if (pA === sA && pB === sB) {
        points = 2; // Đúng tỷ số & tính chất
      } else if (actualOutcome === predictedOutcome) {
        points = 1; // Đúng tính chất
      } else {
        points = 0; // Sai cả hai
      }

      await db.run(
        "UPDATE predictions SET points = ? WHERE user_id = ? AND match_id = ?",
        [points, pred.user_id, matchId]
      );
    }
  }
  console.log("✓ Cập nhật kết quả & Tính điểm tự động hoàn tất.");

  // 6. Truy vấn bảng xếp hạng
  console.log("\n6. Truy vấn Bảng xếp hạng mới nhất...");
  const leaderboard = await db.all(`
    SELECT 
      u.fullname, 
      u.nickname,
      COALESCE(SUM(p.points), 0) as totalPoints,
      COALESCE(SUM(CASE WHEN p.points = 2 THEN 1 ELSE 0 END), 0) as correctScores,
      COALESCE(SUM(CASE WHEN p.points IS NOT NULL THEN 1 ELSE 0 END), 0) as totalScoredPredictions
    FROM users u
    LEFT JOIN predictions p ON u.id = p.user_id
    GROUP BY u.id
    ORDER BY totalPoints DESC, correctScores DESC
  `);

  console.log("Kết quả bảng xếp hạng:");
  console.table(leaderboard);

  // Xác minh điểm số mong đợi:
  // An: 2 điểm (trận 1) + 2 điểm (trận 2) = 4 điểm.
  // Bình: 1 điểm (trận 1) + 0 điểm (trận 2) = 1 điểm.
  const anPoints = leaderboard.find(p => p.nickname === "an_predict")?.totalPoints;
  const binhPoints = leaderboard.find(p => p.nickname === "binh_predict")?.totalPoints;

  if (anPoints === 4 && binhPoints === 1) {
    console.log("\n>>> THÀNH CÔNG: Mọi kiểm thử nghiệp vụ database đều hoạt động CHÍNH XÁC! <<<");
  } else {
    console.error(`\n>>> THẤT BẠI: Điểm số tính toán không đúng! An: ${anPoints} (kỳ vọng 4), Bình: ${binhPoints} (kỳ vọng 1) <<<`);
  }

  // Dọn dẹp database test
  await db.close();
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
}

runTests().catch(console.error);
