import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { Logo } from "@/components/brand/logo"
import { ADMIN_HOME_PATH, getCurrentAdmin } from "@/server/admin/auth"

import { LoginForm } from "./login-form"

export const metadata: Metadata = { title: "Вхід" }

export default async function AdminLoginPage() {
  if (await getCurrentAdmin()) redirect(ADMIN_HOME_PATH)

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-7 sm:p-9">
        <Logo />
        <h1 className="mt-8 font-sans text-xl font-medium text-ink">Вхід для менеджера</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Службовий розділ магазину. Покупцям акаунт не потрібен.
        </p>
        <LoginForm />
      </div>
    </main>
  )
}
