"use client"

import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { login, type LoginState } from "./actions"

const initialState: LoginState = {}

export function LoginForm() {
  const [state, action, pending] = useActionState(login, initialState)

  return (
    <form action={action} className="mt-8 space-y-5">
      <div>
        <label htmlFor="login" className="text-sm font-medium text-ink">
          Логін
        </label>
        <Input
          id="login"
          name="login"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={100}
          defaultValue={state.login}
          className="mt-1.5 h-11 bg-card px-3.5"
        />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-medium text-ink">
          Пароль
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={200}
          aria-describedby={state.error ? "login-error" : undefined}
          className="mt-1.5 h-11 bg-card px-3.5"
        />
      </div>
      <p id="login-error" role="alert" className="min-h-5 text-sm text-destructive">
        {state.error}
      </p>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Перевіряємо…" : "Увійти"}
      </Button>
    </form>
  )
}
