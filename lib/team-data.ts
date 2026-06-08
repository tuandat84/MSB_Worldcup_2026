export type TeamMeta = {
  vi: string
  iso: string
}

/** Tên tiếng Việt và mã cờ (theo phong cách VnExpress) */
export const TEAMS: Record<string, TeamMeta> = {
  Mexico: { vi: "Mexico", iso: "mx" },
  "South Korea": { vi: "Hàn Quốc", iso: "kr" },
  "South Africa": { vi: "Nam Phi", iso: "za" },
  Czechia: { vi: "Séc", iso: "cz" },
  Canada: { vi: "Canada", iso: "ca" },
  Qatar: { vi: "Qatar", iso: "qa" },
  Switzerland: { vi: "Thụy Sĩ", iso: "ch" },
  "Bosnia and Herzegovina": { vi: "Bosnia-Herzegovina", iso: "ba" },
  Brazil: { vi: "Brazil", iso: "br" },
  Haiti: { vi: "Haiti", iso: "ht" },
  Morocco: { vi: "Maroc", iso: "ma" },
  Scotland: { vi: "Scotland", iso: "gb-sct" },
  USA: { vi: "Mỹ", iso: "us" },
  Australia: { vi: "Australia", iso: "au" },
  Paraguay: { vi: "Paraguay", iso: "py" },
  Turkiye: { vi: "Thổ Nhĩ Kỳ", iso: "tr" },
  Germany: { vi: "Đức", iso: "de" },
  Ecuador: { vi: "Ecuador", iso: "ec" },
  "Ivory Coast": { vi: "Bờ Biển Ngà", iso: "ci" },
  Curacao: { vi: "Curaçao", iso: "cw" },
  Netherlands: { vi: "Hà Lan", iso: "nl" },
  Japan: { vi: "Nhật Bản", iso: "jp" },
  Sweden: { vi: "Thụy Điển", iso: "se" },
  Tunisia: { vi: "Tunisia", iso: "tn" },
  Belgium: { vi: "Bỉ", iso: "be" },
  Egypt: { vi: "Ai Cập", iso: "eg" },
  Iran: { vi: "Iran", iso: "ir" },
  "New Zealand": { vi: "New Zealand", iso: "nz" },
  Spain: { vi: "Tây Ban Nha", iso: "es" },
  Uruguay: { vi: "Uruguay", iso: "uy" },
  "Saudi Arabia": { vi: "Ả Rập Xê Út", iso: "sa" },
  "Cape Verde": { vi: "Cape Verde", iso: "cv" },
  France: { vi: "Pháp", iso: "fr" },
  Iraq: { vi: "Iraq", iso: "iq" },
  Norway: { vi: "Na Uy", iso: "no" },
  Senegal: { vi: "Senegal", iso: "sn" },
  Argentina: { vi: "Argentina", iso: "ar" },
  Algeria: { vi: "Algeria", iso: "dz" },
  Austria: { vi: "Áo", iso: "at" },
  Jordan: { vi: "Jordan", iso: "jo" },
  Portugal: { vi: "Bồ Đào Nha", iso: "pt" },
  Colombia: { vi: "Colombia", iso: "co" },
  "DR Congo": { vi: "CHDC Congo", iso: "cd" },
  Uzbekistan: { vi: "Uzbekistan", iso: "uz" },
  Croatia: { vi: "Croatia", iso: "hr" },
  England: { vi: "Anh", iso: "gb-eng" },
  Ghana: { vi: "Ghana", iso: "gh" },
  Panama: { vi: "Panama", iso: "pa" },
}

export function getTeamMeta(name: string): TeamMeta {
  return TEAMS[name] ?? { vi: name, iso: "un" }
}

export function getTeamViName(name: string): string {
  return getTeamMeta(name).vi
}

export function getTeamFlagPath(name: string): string {
  const iso = getTeamMeta(name).iso
  return `/flags/${iso}.png`
}

export const TEAM_WIKI_VI: Record<string, string> = {
  Brazil: "Đội tuyển bóng đá Brazil",
  Argentina: "Đội tuyển bóng đá Argentina",
  Germany: "Đội tuyển bóng đá Đức",
  France: "Đội tuyển bóng đá Pháp",
  Spain: "Đội tuyển bóng đá Tây Ban Nha",
  England: "Đội tuyển bóng đá Anh",
  Portugal: "Đội tuyển bóng đá Bồ Đào Nha",
  Netherlands: "Đội tuyển bóng đá Hà Lan",
  Belgium: "Đội tuyển bóng đá Bỉ",
  Croatia: "Đội tuyển bóng đá Croatia",
  USA: "Đội tuyển bóng đá Hoa Kỳ",
  Mexico: "Đội tuyển bóng đá Mexico",
  Japan: "Đội tuyển bóng đá Nhật Bản",
  "South Korea": "Đội tuyển bóng đá Hàn Quốc",
  Morocco: "Đội tuyển bóng đá Maroc",
  Senegal: "Đội tuyển bóng đá Senegal",
  Uruguay: "Đội tuyển bóng đá Uruguay",
  Colombia: "Đội tuyển bóng đá Colombia",
  Switzerland: "Đội tuyển bóng đá Thụy Sĩ",
  Austria: "Đội tuyển bóng đá Áo",
  Sweden: "Đội tuyển bóng đá Thụy Điển",
  Norway: "Đội tuyển bóng đá Na Uy",
  Iran: "Đội tuyển bóng đá Iran",
  Australia: "Đội tuyển bóng đá Australia",
  Canada: "Đội tuyển bóng đá Canada",
  Ecuador: "Đội tuyển bóng đá Ecuador",
  Ghana: "Đội tuyển bóng đá Ghana",
  Tunisia: "Đội tuyển bóng đá Tunisia",
  Algeria: "Đội tuyển bóng đá Algeria",
  Egypt: "Đội tuyển bóng đá Ai Cập",
  "Saudi Arabia": "Đội tuyển bóng đá Ả Rập Xê Út",
  Qatar: "Đội tuyển bóng đá Qatar",
  Paraguay: "Đội tuyển bóng đá Paraguay",
  Turkiye: "Đội tuyển bóng đá Thổ Nhĩ Kỳ",
  Scotland: "Đội tuyển bóng đá Scotland",
  "Ivory Coast": "Đội tuyển bóng đá Bờ Biển Ngà",
  Jordan: "Đội tuyển bóng đá Jordan",
  Iraq: "Đội tuyển bóng đá Iraq",
  Panama: "Đội tuyển bóng đá Panama",
  Haiti: "Đội tuyển bóng đá Haiti",
  Uzbekistan: "Đội tuyển bóng đá Uzbekistan",
  "DR Congo": "Đội tuyển bóng đá Cộng hòa Dân chủ Congo",
  "Cape Verde": "Đội tuyển bóng đá Cape Verde",
  "New Zealand": "Đội tuyển bóng đá New Zealand",
  Curacao: "Đội tuyển bóng đá Curaçao",
  Czechia: "Đội tuyển bóng đá Cộng hòa Séc",
  "South Africa": "Đội tuyển bóng đá Nam Phi",
  "Bosnia and Herzegovina": "Đội tuyển bóng đá Bosnia và Herzegovina",
}

export const TEAM_STRENGTH: Record<string, number> = {
  Brazil: 92, Argentina: 91, France: 90, England: 89, Spain: 88,
  Germany: 87, Portugal: 86, Netherlands: 85, Belgium: 84, Croatia: 83,
  USA: 78, Mexico: 77, Uruguay: 82, Colombia: 80, Japan: 79,
  "South Korea": 78, Morocco: 81, Senegal: 79, Switzerland: 80,
  Austria: 77, Sweden: 76, Norway: 75, Iran: 76, Australia: 74,
  Canada: 73, Ecuador: 75, Ghana: 74, Tunisia: 72, Algeria: 73,
  Egypt: 72, "Saudi Arabia": 71, Qatar: 70, Paraguay: 73, Turkiye: 76,
  Scotland: 75, "Ivory Coast": 74, Jordan: 68, Iraq: 69, Panama: 67,
  Haiti: 65, Uzbekistan: 68, "DR Congo": 70, "Cape Verde": 66,
  "New Zealand": 64, Curacao: 63, Czechia: 76, "South Africa": 68,
  "Bosnia and Herzegovina": 71,
}

export function getTeamStrength(name: string): number {
  return TEAM_STRENGTH[name] ?? 70
}

/** Danh sách mã cờ cần tải về public/flags/ */
export function getAllFlagCodes(): string[] {
  const codes = new Set(Object.values(TEAMS).map((t) => t.iso))
  codes.add("un")
  return [...codes].sort()
}
