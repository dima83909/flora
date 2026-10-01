/**
 * Deletes finished (completed or cancelled) orders older than N months, to limit how long
 * customers' names and phone numbers are kept. Orders in progress are never deleted.
 * Deletion is permanent. Without PURGE_CONFIRM=1 it only reports what it would delete.
 *
 *   PURGE_MONTHS=24 npm run orders:purge                    # dry run
 *   PURGE_MONTHS=24 PURGE_CONFIRM=1 npm run orders:purge    # delete
 */
import "dotenv/config"

import { getDb } from "@/server/db"
import { purgeOrders } from "@/server/maintenance"

async function main() {
  const raw = process.env.PURGE_MONTHS?.trim() ?? ""
  if (!/^\d+$/.test(raw) || Number(raw) < 1) {
    throw new Error("Set PURGE_MONTHS to a whole number of months (at least 1), e.g. PURGE_MONTHS=24")
  }

  const { count, cutoff, dryRun } = await purgeOrders({
    olderThanMonths: Number(raw),
    dryRun: process.env.PURGE_CONFIRM !== "1",
  })
  const date = cutoff.toISOString().slice(0, 10)
  console.log(
    dryRun
      ? `Dry run: ${count} completed/cancelled order(s) placed before ${date} would be deleted. Set PURGE_CONFIRM=1 to delete them.`
      : `Deleted ${count} completed/cancelled order(s) placed before ${date}.`
  )
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => getDb().$disconnect())
