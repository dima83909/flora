import Link from "next/link"

import { AdminNav } from "@/components/admin/admin-nav"
import { Button } from "@/components/ui/button"
import { requireAdmin } from "@/server/admin/auth"

import { logout } from "./actions"

/*
 * Chrome for signed-in managers. The check here keeps the header from rendering for
 * strangers, but it is not what protects the data: layouts do not re-run on every
 * navigation, so each page, action and data function calls requireAdmin() itself.
 */
export default async function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin()

  return (
    <>
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 sm:gap-6 sm:px-6">
          <Link href="/admin/orders" className="inline-flex items-center font-heading text-xl leading-none font-light whitespace-nowrap text-ink pointer-coarse:min-h-11 pointer-coarse:min-w-11">
            flora <span className="hidden font-sans text-sm font-normal text-muted-foreground sm:inline">адмін</span>
          </Link>
          <AdminNav />
          <div className="ml-auto flex min-w-0 items-center gap-3">
            <span className="hidden truncate text-sm text-ink-soft sm:block" title={admin.login}>
              {admin.name}
            </span>
            <form action={logout}>
              <Button type="submit" variant="outline" size="sm">
                Вийти
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </>
  )
}
