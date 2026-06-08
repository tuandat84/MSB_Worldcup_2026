/**
 * Lịch thi đấu vòng bảng World Cup 2026 — 72 trận
 * Nguồn: FIFA / ESPN (kickoff ET), quy đổi sang giờ Việt Nam (GMT+7)
 * https://www.espn.com/soccer/story/_/id/47224100/fifa-2026-world-cup-match-schedule-final-kickoff-usa
 */

export type ScheduledMatch = {
  round: string
  teamA: string
  teamB: string
  kickoff: string
}

const pad = (n: number) => String(n).padStart(2, "0")

/** Chuyển giờ ET (EDT, UTC-4) sang ISO UTC — tương đương giờ VN (ET + 11h) */
export function etKickoffToUtcIso(
  year: number,
  month: number,
  day: number,
  hourET: number,
  minuteET = 0
): string {
  return new Date(
    `${year}-${pad(month)}-${pad(day)}T${pad(hourET)}:${pad(minuteET)}:00-04:00`
  ).toISOString()
}

/** Alias: giờ Việt Nam trực tiếp */
export function vnKickoffToUtcIso(
  year: number,
  month: number,
  day: number,
  hourVN: number,
  minuteVN = 0
): string {
  return new Date(
    `${year}-${pad(month)}-${pad(day)}T${pad(hourVN)}:${pad(minuteVN)}:00+07:00`
  ).toISOString()
}

const et = etKickoffToUtcIso

/**
 * 72 trận vòng bảng — đội hình sau bốc thăm FIFA 12/2025
 * Playoff được ánh xạ: Czechia, Bosnia, Turkiye, Sweden, Iraq, DR Congo
 */
export function buildGroupStageSchedule(): ScheduledMatch[] {
  return [
    // ===== BẢNG A =====
    { round: "Bảng A - Lượt 1", teamA: "Mexico", teamB: "South Africa", kickoff: et(2026, 6, 11, 15, 0) },
    { round: "Bảng A - Lượt 1", teamA: "South Korea", teamB: "Czechia", kickoff: et(2026, 6, 11, 22, 0) },
    { round: "Bảng A - Lượt 2", teamA: "Czechia", teamB: "South Africa", kickoff: et(2026, 6, 18, 12, 0) },
    { round: "Bảng A - Lượt 2", teamA: "Mexico", teamB: "South Korea", kickoff: et(2026, 6, 18, 23, 0) },
    { round: "Bảng A - Lượt 3", teamA: "Czechia", teamB: "Mexico", kickoff: et(2026, 6, 24, 21, 0) },
    { round: "Bảng A - Lượt 3", teamA: "South Africa", teamB: "South Korea", kickoff: et(2026, 6, 24, 21, 0) },

    // ===== BẢNG B =====
    { round: "Bảng B - Lượt 1", teamA: "Canada", teamB: "Bosnia and Herzegovina", kickoff: et(2026, 6, 12, 15, 0) },
    { round: "Bảng B - Lượt 1", teamA: "Qatar", teamB: "Switzerland", kickoff: et(2026, 6, 13, 15, 0) },
    { round: "Bảng B - Lượt 2", teamA: "Switzerland", teamB: "Bosnia and Herzegovina", kickoff: et(2026, 6, 18, 15, 0) },
    { round: "Bảng B - Lượt 2", teamA: "Canada", teamB: "Qatar", kickoff: et(2026, 6, 18, 18, 0) },
    { round: "Bảng B - Lượt 3", teamA: "Switzerland", teamB: "Canada", kickoff: et(2026, 6, 24, 15, 0) },
    { round: "Bảng B - Lượt 3", teamA: "Bosnia and Herzegovina", teamB: "Qatar", kickoff: et(2026, 6, 24, 15, 0) },

    // ===== BẢNG C =====
    { round: "Bảng C - Lượt 1", teamA: "Brazil", teamB: "Morocco", kickoff: et(2026, 6, 13, 18, 0) },
    { round: "Bảng C - Lượt 1", teamA: "Haiti", teamB: "Scotland", kickoff: et(2026, 6, 13, 21, 0) },
    { round: "Bảng C - Lượt 2", teamA: "Scotland", teamB: "Morocco", kickoff: et(2026, 6, 19, 18, 0) },
    { round: "Bảng C - Lượt 2", teamA: "Brazil", teamB: "Haiti", kickoff: et(2026, 6, 19, 21, 0) },
    { round: "Bảng C - Lượt 3", teamA: "Scotland", teamB: "Brazil", kickoff: et(2026, 6, 24, 18, 0) },
    { round: "Bảng C - Lượt 3", teamA: "Morocco", teamB: "Haiti", kickoff: et(2026, 6, 24, 18, 0) },

    // ===== BẢNG D =====
    { round: "Bảng D - Lượt 1", teamA: "USA", teamB: "Paraguay", kickoff: et(2026, 6, 12, 21, 0) },
    { round: "Bảng D - Lượt 1", teamA: "Australia", teamB: "Turkiye", kickoff: et(2026, 6, 14, 0, 0) },
    { round: "Bảng D - Lượt 2", teamA: "USA", teamB: "Australia", kickoff: et(2026, 6, 19, 15, 0) },
    { round: "Bảng D - Lượt 2", teamA: "Turkiye", teamB: "Paraguay", kickoff: et(2026, 6, 20, 0, 0) },
    { round: "Bảng D - Lượt 3", teamA: "Turkiye", teamB: "USA", kickoff: et(2026, 6, 25, 22, 0) },
    { round: "Bảng D - Lượt 3", teamA: "Paraguay", teamB: "Australia", kickoff: et(2026, 6, 25, 22, 0) },

    // ===== BẢNG E =====
    { round: "Bảng E - Lượt 1", teamA: "Germany", teamB: "Curacao", kickoff: et(2026, 6, 14, 13, 0) },
    { round: "Bảng E - Lượt 1", teamA: "Ivory Coast", teamB: "Ecuador", kickoff: et(2026, 6, 14, 19, 0) },
    { round: "Bảng E - Lượt 2", teamA: "Germany", teamB: "Ivory Coast", kickoff: et(2026, 6, 20, 16, 0) },
    { round: "Bảng E - Lượt 2", teamA: "Ecuador", teamB: "Curacao", kickoff: et(2026, 6, 20, 20, 0) },
    { round: "Bảng E - Lượt 3", teamA: "Ecuador", teamB: "Germany", kickoff: et(2026, 6, 25, 16, 0) },
    { round: "Bảng E - Lượt 3", teamA: "Curacao", teamB: "Ivory Coast", kickoff: et(2026, 6, 25, 16, 0) },

    // ===== BẢNG F =====
    { round: "Bảng F - Lượt 1", teamA: "Netherlands", teamB: "Japan", kickoff: et(2026, 6, 14, 16, 0) },
    { round: "Bảng F - Lượt 1", teamA: "Sweden", teamB: "Tunisia", kickoff: et(2026, 6, 14, 22, 0) },
    { round: "Bảng F - Lượt 2", teamA: "Netherlands", teamB: "Sweden", kickoff: et(2026, 6, 20, 13, 0) },
    { round: "Bảng F - Lượt 2", teamA: "Tunisia", teamB: "Japan", kickoff: et(2026, 6, 21, 0, 0) },
    { round: "Bảng F - Lượt 3", teamA: "Japan", teamB: "Sweden", kickoff: et(2026, 6, 25, 19, 0) },
    { round: "Bảng F - Lượt 3", teamA: "Tunisia", teamB: "Netherlands", kickoff: et(2026, 6, 25, 19, 0) },

    // ===== BẢNG G =====
    { round: "Bảng G - Lượt 1", teamA: "Belgium", teamB: "Egypt", kickoff: et(2026, 6, 15, 18, 0) },
    { round: "Bảng G - Lượt 1", teamA: "Iran", teamB: "New Zealand", kickoff: et(2026, 6, 16, 0, 0) },
    { round: "Bảng G - Lượt 2", teamA: "Belgium", teamB: "Iran", kickoff: et(2026, 6, 21, 15, 0) },
    { round: "Bảng G - Lượt 2", teamA: "New Zealand", teamB: "Egypt", kickoff: et(2026, 6, 21, 21, 0) },
    { round: "Bảng G - Lượt 3", teamA: "Egypt", teamB: "Iran", kickoff: et(2026, 6, 26, 23, 0) },
    { round: "Bảng G - Lượt 3", teamA: "New Zealand", teamB: "Belgium", kickoff: et(2026, 6, 26, 23, 0) },

    // ===== BẢNG H =====
    { round: "Bảng H - Lượt 1", teamA: "Spain", teamB: "Cape Verde", kickoff: et(2026, 6, 15, 13, 0) },
    { round: "Bảng H - Lượt 1", teamA: "Saudi Arabia", teamB: "Uruguay", kickoff: et(2026, 6, 15, 18, 0) },
    { round: "Bảng H - Lượt 2", teamA: "Spain", teamB: "Saudi Arabia", kickoff: et(2026, 6, 21, 12, 0) },
    { round: "Bảng H - Lượt 2", teamA: "Uruguay", teamB: "Cape Verde", kickoff: et(2026, 6, 21, 18, 0) },
    { round: "Bảng H - Lượt 3", teamA: "Cape Verde", teamB: "Saudi Arabia", kickoff: et(2026, 6, 26, 20, 0) },
    { round: "Bảng H - Lượt 3", teamA: "Uruguay", teamB: "Spain", kickoff: et(2026, 6, 26, 20, 0) },

    // ===== BẢNG I =====
    { round: "Bảng I - Lượt 1", teamA: "France", teamB: "Senegal", kickoff: et(2026, 6, 16, 15, 0) },
    { round: "Bảng I - Lượt 1", teamA: "Iraq", teamB: "Norway", kickoff: et(2026, 6, 16, 18, 0) },
    { round: "Bảng I - Lượt 2", teamA: "France", teamB: "Iraq", kickoff: et(2026, 6, 22, 17, 0) },
    { round: "Bảng I - Lượt 2", teamA: "Norway", teamB: "Senegal", kickoff: et(2026, 6, 22, 20, 0) },
    { round: "Bảng I - Lượt 3", teamA: "Norway", teamB: "France", kickoff: et(2026, 6, 26, 15, 0) },
    { round: "Bảng I - Lượt 3", teamA: "Senegal", teamB: "Iraq", kickoff: et(2026, 6, 26, 15, 0) },

    // ===== BẢNG J =====
    { round: "Bảng J - Lượt 1", teamA: "Argentina", teamB: "Algeria", kickoff: et(2026, 6, 16, 21, 0) },
    { round: "Bảng J - Lượt 1", teamA: "Austria", teamB: "Jordan", kickoff: et(2026, 6, 17, 0, 0) },
    { round: "Bảng J - Lượt 2", teamA: "Argentina", teamB: "Austria", kickoff: et(2026, 6, 22, 13, 0) },
    { round: "Bảng J - Lượt 2", teamA: "Jordan", teamB: "Algeria", kickoff: et(2026, 6, 22, 23, 0) },
    { round: "Bảng J - Lượt 3", teamA: "Algeria", teamB: "Austria", kickoff: et(2026, 6, 27, 22, 0) },
    { round: "Bảng J - Lượt 3", teamA: "Jordan", teamB: "Argentina", kickoff: et(2026, 6, 27, 22, 0) },

    // ===== BẢNG K =====
    { round: "Bảng K - Lượt 1", teamA: "Portugal", teamB: "DR Congo", kickoff: et(2026, 6, 17, 13, 0) },
    { round: "Bảng K - Lượt 1", teamA: "Uzbekistan", teamB: "Colombia", kickoff: et(2026, 6, 17, 22, 0) },
    { round: "Bảng K - Lượt 2", teamA: "Portugal", teamB: "Uzbekistan", kickoff: et(2026, 6, 23, 13, 0) },
    { round: "Bảng K - Lượt 2", teamA: "Colombia", teamB: "DR Congo", kickoff: et(2026, 6, 23, 22, 0) },
    { round: "Bảng K - Lượt 3", teamA: "Colombia", teamB: "Portugal", kickoff: et(2026, 6, 27, 19, 30) },
    { round: "Bảng K - Lượt 3", teamA: "DR Congo", teamB: "Uzbekistan", kickoff: et(2026, 6, 27, 19, 30) },

    // ===== BẢNG L =====
    { round: "Bảng L - Lượt 1", teamA: "England", teamB: "Croatia", kickoff: et(2026, 6, 17, 16, 0) },
    { round: "Bảng L - Lượt 1", teamA: "Ghana", teamB: "Panama", kickoff: et(2026, 6, 17, 19, 0) },
    { round: "Bảng L - Lượt 2", teamA: "England", teamB: "Ghana", kickoff: et(2026, 6, 23, 16, 0) },
    { round: "Bảng L - Lượt 2", teamA: "Panama", teamB: "Croatia", kickoff: et(2026, 6, 23, 19, 0) },
    { round: "Bảng L - Lượt 3", teamA: "Panama", teamB: "England", kickoff: et(2026, 6, 27, 17, 0) },
    { round: "Bảng L - Lượt 3", teamA: "Croatia", teamB: "Ghana", kickoff: et(2026, 6, 27, 17, 0) },
  ]
}
