import { getTeamStrength, getTeamViName, TEAM_WIKI_VI } from "./team-data"
import { parseKickoff } from "./format-date"

export type MatchOdds = {
  teamAWin: number
  draw: number
  teamBWin: number
  favorite: "A" | "B" | "even"
}

export type AiPrediction = {
  scoreA: number
  scoreB: number
  confidence: number
  summary: string
  reasoning: string
  source: "openai" | "local"
}

async function fetchWikiSummary(teamName: string): Promise<string | null> {
  const titles = [
    TEAM_WIKI_VI[teamName],
    `Đội tuyển bóng đá quốc gia ${teamName}`,
    teamName,
  ].filter(Boolean) as string[]

  for (const title of titles) {
    try {
      const res = await fetch(
        `https://vi.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
        {
          headers: { "User-Agent": "MSB-WorldCup2026/1.0 (contact@msb.com.vn)" },
          next: { revalidate: 86400 },
        }
      )
      if (res.ok) {
        const data = await res.json()
        if (data.extract) return data.extract as string
      }
    } catch {
      // thử title tiếp theo
    }
  }
  return null
}

export function calculateOdds(teamA: string, teamB: string): MatchOdds {
  const strengthA = getTeamStrength(teamA)
  const strengthB = getTeamStrength(teamB)
  const diff = strengthA - strengthB

  let teamAWin = 33 + diff * 1.2
  let teamBWin = 33 - diff * 1.2
  let draw = 34 - Math.abs(diff) * 0.3

  teamAWin = Math.max(12, Math.min(72, teamAWin))
  teamBWin = Math.max(12, Math.min(72, teamBWin))
  draw = Math.max(18, Math.min(40, draw))

  const total = teamAWin + draw + teamBWin
  teamAWin = Math.round((teamAWin / total) * 100)
  teamBWin = Math.round((teamBWin / total) * 100)
  draw = 100 - teamAWin - teamBWin

  let favorite: MatchOdds["favorite"] = "even"
  if (strengthA > strengthB + 4) favorite = "A"
  else if (strengthB > strengthA + 4) favorite = "B"

  return { teamAWin, draw, teamBWin, favorite }
}

function generateLocalAiPrediction(
  teamA: string,
  teamB: string,
  round: string,
  odds: MatchOdds
): AiPrediction {
  const strengthA = getTeamStrength(teamA)
  const strengthB = getTeamStrength(teamB)

  let scoreA = 1
  let scoreB = 1

  if (odds.favorite === "A") {
    scoreA = strengthA > strengthB + 10 ? 2 : 1
    scoreB = scoreA === 2 ? 0 : 1
  } else if (odds.favorite === "B") {
    scoreB = strengthB > strengthA + 10 ? 2 : 1
    scoreA = scoreB === 2 ? 0 : 1
  }

  const confidence = Math.round(55 + Math.abs(strengthA - strengthB) * 0.8)

  const teamAVi = getTeamViName(teamA)
  const teamBVi = getTeamViName(teamB)
  const favoriteName = odds.favorite === "A" ? teamAVi : odds.favorite === "B" ? teamBVi : "hai đội"
  const reasoning =
    odds.favorite === "even"
      ? `Phân tích dựa trên chỉ số sức mạnh (${strengthA} vs ${strengthB}) cho thấy trận ${round} có tính cân bằng cao. Tỷ lệ hòa ${odds.draw}% phản ánh khả năng chia điểm.`
      : `${favoriteName} được đánh giá nhỉnh hơn với xác suất thắng ${odds.favorite === "A" ? odds.teamAWin : odds.teamBWin}%. Chỉ số tấn công và kinh nghiệm World Cup là yếu tố then chốt.`

  return {
    scoreA,
    scoreB,
    confidence: Math.min(confidence, 85),
    summary: `AI dự đoán tỷ số ${scoreA}-${scoreB} cho trận ${teamAVi} vs ${teamBVi}.`,
    reasoning,
    source: "local",
  }
}

async function generateOpenAiPrediction(
  teamA: string,
  teamB: string,
  round: string,
  kickoff: string,
  odds: MatchOdds,
  overview: string
): Promise<AiPrediction | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content:
              "Bạn là chuyên gia phân tích bóng đá World Cup. Trả lời bằng tiếng Việt, ngắn gọn, khách quan. Luôn trả về JSON hợp lệ.",
          },
          {
            role: "user",
            content: `Phân tích trận ${teamA} vs ${teamB} (${round}, kickoff ${kickoff}).
Tỷ lệ kèo: ${teamA} thắng ${odds.teamAWin}%, Hòa ${odds.draw}%, ${teamB} thắng ${odds.teamBWin}%.
Bối cảnh: ${overview}
Trả về JSON: {"scoreA":number,"scoreB":number,"confidence":number,"summary":string,"reasoning":string}`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    })

    if (!res.ok) return null

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return null

    const parsed = JSON.parse(content)
    return {
      scoreA: Number(parsed.scoreA) || 1,
      scoreB: Number(parsed.scoreB) || 1,
      confidence: Math.min(90, Math.max(50, Number(parsed.confidence) || 65)),
      summary: parsed.summary || "",
      reasoning: parsed.reasoning || "",
      source: "openai",
    }
  } catch {
    return null
  }
}

export async function buildMatchInsights(match: {
  teamA: string
  teamB: string
  round: string
  kickoff: string
}) {
  const [wikiA, wikiB] = await Promise.all([
    fetchWikiSummary(match.teamA),
    fetchWikiSummary(match.teamB),
  ])

  const strengthA = getTeamStrength(match.teamA)
  const strengthB = getTeamStrength(match.teamB)
  const odds = calculateOdds(match.teamA, match.teamB)

  const kickoffDate = parseKickoff(match.kickoff).toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const teamAVi = getTeamViName(match.teamA)
  const teamBVi = getTeamViName(match.teamB)

  const overviewParts = [
    `Trận đấu ${match.round} tại World Cup 2026 giữa ${teamAVi} và ${teamBVi}, dự kiến diễn ra vào ${kickoffDate}.`,
    `${teamAVi} có chỉ số sức mạnh ${strengthA}/100, ${teamBVi} đạt ${strengthB}/100.`,
    odds.favorite === "A"
      ? `${teamAVi} được đánh giá nhỉnh hơn trước trận đấu.`
      : odds.favorite === "B"
        ? `${teamBVi} được đánh giá nhỉnh hơn trước trận đấu.`
        : "Hai đội có sức mạnh tương đương, kỳ vọng một trận đấu cân bằng.",
  ]

  if (wikiA) overviewParts.push(`Về ${teamAVi}: ${wikiA.slice(0, 200)}...`)
  if (wikiB) overviewParts.push(`Về ${teamBVi}: ${wikiB.slice(0, 200)}...`)

  const overview = overviewParts.join(" ")

  const openAiPrediction = await generateOpenAiPrediction(
    match.teamA,
    match.teamB,
    match.round,
    match.kickoff,
    odds,
    overview
  )

  const aiPrediction =
    openAiPrediction ?? generateLocalAiPrediction(match.teamA, match.teamB, match.round, odds)

  return {
    overview,
    teamAInfo: wikiA,
    teamBInfo: wikiB,
    odds,
    aiPrediction,
  }
}
