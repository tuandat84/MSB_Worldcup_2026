import jwt from "jsonwebtoken"
import { NextRequest } from "next/server"
import { getDb } from "./db"

const JWT_SECRET = process.env.JWT_SECRET || "worldcup2026-secret-key-12345"

export interface JWTPayload {
  userId: number
  email: string
  role: string
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

export async function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get("token")?.value
  if (!token) return null

  const decoded = verifyToken(token)
  if (!decoded) return null

  const db = await getDb()
  const user = await db.get(
    "SELECT id, email, fullname, nickname, avatar, role FROM users WHERE id = ?",
    [decoded.userId]
  )

  return user || null
}
