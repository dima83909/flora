"use server"

import { redirect } from "next/navigation"

import { ADMIN_HOME_PATH, signIn } from "@/server/admin/auth"

export type LoginState = { error?: string; login?: string }

export async function login(_previous: LoginState, formData: unknown): Promise<LoginState> {
  // Server actions accept any payload, so a hand-crafted request may not be a form at all
  if (!(formData instanceof FormData)) return { error: "Невірний логін або пароль." }
  const loginValue = formData.get("login")
  const password = formData.get("password")
  const typedLogin = typeof loginValue === "string" ? loginValue.slice(0, 100) : ""

  const result = await signIn({ login: loginValue, password })
  if (result.ok) redirect(ADMIN_HOME_PATH)

  return {
    login: typedLogin,
    error:
      result.reason === "throttled"
        ? `Забагато невдалих спроб. Спробуйте ще раз за ${result.retryAfterMinutes} хв.`
        : "Невірний логін або пароль.",
  }
}
