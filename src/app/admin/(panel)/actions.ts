"use server"

import { redirect } from "next/navigation"

import { ADMIN_LOGIN_PATH, signOut } from "@/server/admin/auth"

export async function logout() {
  await signOut()
  redirect(ADMIN_LOGIN_PATH)
}
