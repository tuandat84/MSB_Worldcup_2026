import { TEAMS } from "./team-data"

/** Ánh xạ tên đội từ nguồn ngoài (ESPN, API-Football) sang tên trong DB */
const ALIASES: Record<string, string> = {
  "bosnia-herzegovina": "Bosnia and Herzegovina",
  "bosnia and herzegovina": "Bosnia and Herzegovina",
  "united states": "USA",
  us: "USA",
  turkey: "Turkiye",
  turkiye: "Turkiye",
  "cote divoire": "Ivory Coast",
  "cote d'ivoire": "Ivory Coast",
  "côte d'ivoire": "Ivory Coast",
  "congo dr": "DR Congo",
  "dr congo": "DR Congo",
  "democratic republic of the congo": "DR Congo",
  "korea republic": "South Korea",
  "republic of korea": "South Korea",
  "south korea": "South Korea",
  "czech republic": "Czechia",
  curacao: "Curacao",
  "curaçao": "Curacao",
  "saudi arabia": "Saudi Arabia",
  "new zealand": "New Zealand",
  "ivory coast": "Ivory Coast",
  "cape verde": "Cape Verde",
  "south africa": "South Africa",
}

const TEAM_KEYS_LOWER = Object.keys(TEAMS).map((k) => [k.toLowerCase(), k] as const)

export function normalizeTeamName(name: string): string {
  const stripped = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s'-]/g, "")
    .trim()

  if (ALIASES[stripped]) return ALIASES[stripped]

  for (const [lower, canonical] of TEAM_KEYS_LOWER) {
    if (lower === stripped) return canonical
  }

  // Khớp một phần (vd. "Bosnia-Herzegovina")
  const compact = stripped.replace(/[-\s]+/g, " ")
  if (ALIASES[compact]) return ALIASES[compact]
  for (const [lower, canonical] of TEAM_KEYS_LOWER) {
    if (lower.replace(/\s+/g, " ") === compact) return canonical
  }

  return name
}

export function isSameTeam(a: string, b: string): boolean {
  return normalizeTeamName(a) === normalizeTeamName(b)
}
