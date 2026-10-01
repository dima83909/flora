import type { Metadata } from "next"

export const metadata: Metadata = {
  title: { default: "Адмін-панель", template: "%s · Flora Admin" },
  description: "Службовий розділ для менеджера магазину.",
  robots: { index: false, follow: false },
}

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return <div className="flex flex-1 flex-col bg-linen/40 font-sans text-ink">{children}</div>
}
