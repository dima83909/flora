/**
 * Removes expired admin sessions and old rate-limit records. Safe to run any time, as often
 * as you like (e.g. daily from cron):
 *
 *   npm run maintenance:cleanup
 */
import "dotenv/config"

import { getDb } from "@/server/db"
import { cleanupExpired } from "@/server/maintenance"

cleanupExpired()
  .then((result) =>
    console.log(
      `Removed ${result.sessions} expired session(s), ${result.loginAttempts} sign-in record(s), ${result.orderAttempts} order-limit record(s).`
    )
  )
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => getDb().$disconnect())
