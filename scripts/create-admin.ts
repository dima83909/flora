/**
 * Creates the admin account, or resets its password (which also signs it out everywhere).
 *
 *   ADMIN_LOGIN=manager ADMIN_NAME="Олена" ADMIN_PASSWORD='…' npm run admin:create
 *
 * The password is read from the environment so it never lands in the repository.
 */
import "dotenv/config"

import { getDb } from "@/server/db"
import { hashPassword, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/server/admin/password"

async function main() {
  const login = process.env.ADMIN_LOGIN?.trim().toLowerCase() ?? ""
  const name = process.env.ADMIN_NAME?.trim() || login
  const password = process.env.ADMIN_PASSWORD ?? ""

  if (login.length < 3 || login.length > 100) throw new Error("ADMIN_LOGIN must be 3–100 characters")
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    throw new Error(`ADMIN_PASSWORD must be ${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} characters`)
  }

  const db = getDb()
  const passwordHash = await hashPassword(password)
  const admin = await db.adminUser.upsert({
    where: { login },
    create: { login, name, passwordHash },
    update: { name, passwordHash, isActive: true },
  })
  const { count } = await db.adminSession.deleteMany({ where: { adminId: admin.id } })
  await db.adminLoginAttempt.deleteMany({ where: { login } })

  console.log(`Admin "${admin.login}" is ready${count ? `; ${count} existing session(s) signed out` : ""}.`)
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => getDb().$disconnect())
