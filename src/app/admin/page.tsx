import { redirect } from "next/navigation"

import { ADMIN_HOME_PATH, requireAdmin } from "@/server/admin/auth"

export default async function AdminIndexPage() {
  await requireAdmin()
  redirect(ADMIN_HOME_PATH)
}
