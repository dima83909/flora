import "server-only"

import { createHash, randomBytes } from "node:crypto"

import { cookies } from "next/headers"

import { getDb } from "@/server/db"

/*
 * Database-backed admin sessions. The cookie carries a random 256-bit token and
 * nothing else; the server stores only its SHA-256 and looks the session up on
 * every request, so signing out (or deactivating the admin) takes effect at once.
 */

export const SESSION_COOKIE = "flora_admin_session"
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex")

export async function createSession(adminId: string) {
  const token = randomBytes(32).toString("base64url")
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  const db = getDb()

  await db.adminSession.deleteMany({ where: { expiresAt: { lt: new Date() } } })
  await db.adminSession.create({ data: { tokenHash: hashToken(token), adminId, expiresAt } })

  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    // The browser sends it to the admin area only, never to the storefront
    path: "/admin",
    expires: expiresAt,
  })
}

/** The admin behind the session cookie, or null when it is missing, expired or revoked */
export async function readSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token || token.length > 100) return null

  const session = await getDb().adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, expiresAt: true, admin: { select: { id: true, login: true, name: true, isActive: true } } },
  })
  if (!session || session.expiresAt <= new Date() || !session.admin.isActive) return null

  return { sessionId: session.id, id: session.admin.id, login: session.admin.login, name: session.admin.name }
}

export async function destroySession() {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (token) await getDb().adminSession.deleteMany({ where: { tokenHash: hashToken(token) } })
  store.delete({ name: SESSION_COOKIE, path: "/admin" })
}
