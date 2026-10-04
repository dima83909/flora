import { notFound } from "next/navigation"

import { requireAdmin } from "@/server/admin/auth"

// Unknown /admin/* addresses would otherwise fall through to the storefront's root 404.
// Catching them here renders the admin 404 inside the panel, and only for signed-in managers.
export default async function AdminUnknownPage() {
  await requireAdmin()
  notFound()
}
