const sqlite3 = require("sqlite3")
const { open } = require("sqlite")

const GROUPS = [
  { name: "Bảng A", teams: ["Mexico", "South Korea", "South Africa", "Czechia"] },
  { name: "Bảng B", teams: ["Canada", "Qatar", "Switzerland", "Bosnia and Herzegovina"] },
  { name: "Bảng C", teams: ["Brazil", "Haiti", "Morocco", "Scotland"] },
  { name: "Bảng D", teams: ["USA", "Australia", "Paraguay", "Turkiye"] },
  { name: "Bảng E", teams: ["Germany", "Ecuador", "Ivory Coast", "Curacao"] },
  { name: "Bảng F", teams: ["Netherlands", "Japan", "Sweden", "Tunisia"] },
  { name: "Bảng G", teams: ["Belgium", "Egypt", "Iran", "New Zealand"] },
  { name: "Bảng H", teams: ["Spain", "Uruguay", "Saudi Arabia", "Cape Verde"] },
  { name: "Bảng I", teams: ["France", "Iraq", "Norway", "Senegal"] },
  { name: "Bảng J", teams: ["Argentina", "Algeria", "Austria", "Jordan"] },
  { name: "Bảng K", teams: ["Portugal", "Colombia", "DR Congo", "Uzbekistan"] },
  { name: "Bảng L", teams: ["Croatia", "England", "Ghana", "Panama"] },
]

const pad = (n) => String(n).padStart(2, "0")

function vnKickoffToUtcIso(year, month, day, hourVN) {
  return new Date(`${year}-${pad(month)}-${pad(day)}T${pad(hourVN)}:00:00+07:00`).toISOString()
}

function addDaysVN(year, month, day, days) {
  const d = new Date(`${year}-${pad(month)}-${pad(day)}T12:00:00+07:00`)
  d.setDate(d.getDate() + days)
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() }
}

function buildSchedule() {
  const matches = []
  const startYear = 2026, startMonth = 6, startDay = 12

  for (let gIdx = 0; gIdx < GROUPS.length; gIdx++) {
    const group = GROUPS[gIdx]
    const teams = group.teams
    const matchSchedule = [
      { home: teams[0], away: teams[1], roundNum: 1 },
      { home: teams[2], away: teams[3], roundNum: 1 },
      { home: teams[0], away: teams[2], roundNum: 2 },
      { home: teams[1], away: teams[3], roundNum: 2 },
      { home: teams[0], away: teams[3], roundNum: 3 },
      { home: teams[1], away: teams[2], roundNum: 3 },
    ]

    for (let mIdx = 0; mIdx < matchSchedule.length; mIdx++) {
      const fixture = matchSchedule[mIdx]
      const matchDayIndex = Math.floor(gIdx / 2) + (fixture.roundNum - 1) * 6
      const { year, month, day } = addDaysVN(startYear, startMonth, startDay, matchDayIndex)
      const hourVN = mIdx % 2 === 0 ? 14 : 20
      matches.push({
        round: `${group.name} - Lượt ${fixture.roundNum}`,
        teamA: fixture.home,
        teamB: fixture.away,
        kickoff: vnKickoffToUtcIso(year, month, day, hourVN),
      })
    }
  }
  return matches
}

async function main() {
  const db = await open({ filename: "worldcup.db", driver: sqlite3.Database })
  const schedule = buildSchedule()
  const existing = await db.all("SELECT id, round, team_a, team_b FROM matches")
  let updated = 0
  for (const row of existing) {
    const fixture = schedule.find(
      (s) => s.teamA === row.team_a && s.teamB === row.team_b && s.round === row.round
    )
    if (fixture) {
      await db.run("UPDATE matches SET kickoff = ? WHERE id = ?", [fixture.kickoff, row.id])
      updated++
    }
  }
  console.log(`Updated ${updated} matches`)

  const mx = await db.get(
    "SELECT kickoff FROM matches WHERE team_a='Mexico' AND team_b='South Korea'"
  )
  const d = new Date(mx.kickoff)
  console.log(
    "Mexico vs South Korea:",
    mx.kickoff,
    "-> VN:",
    d.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
  )
  await db.close()
}

main()
