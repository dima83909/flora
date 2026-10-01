import type { Metadata } from "next"

import { CheckoutView } from "@/components/checkout/checkout-view"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { canonicalPath } from "@/lib/structured-data"

export const metadata: Metadata = {
  title: "Оформлення замовлення",
  description: "Залиште ім'я, телефон і місто, і менеджер напише вам у Telegram, щоб узгодити доставку та оплату.",
  alternates: { canonical: canonicalPath("/checkout") },
  robots: { index: false, follow: false },
}

export default function CheckoutPage() {
  return (
    <div className="container-page pt-6 pb-20 md:pt-8 md:pb-28">
      <Breadcrumbs
        items={[
          { name: "Головна", href: "/" },
          { name: "Оформлення замовлення", href: "/checkout" },
        ]}
      />
      <h1 className="mt-6 text-title font-light text-ink md:mt-10">Оформлення замовлення</h1>
      <CheckoutView />
    </div>
  )
}
