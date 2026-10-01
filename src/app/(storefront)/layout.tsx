import { StorefrontShell } from "@/components/layout/storefront-shell"

export default function StorefrontLayout({ children }: LayoutProps<"/">) {
  return <StorefrontShell>{children}</StorefrontShell>
}
