import { siteConfig } from "@/config/site"

export function AnnouncementBar() {
  return (
    <div className="bg-moss text-paper">
      <p className="container-page py-2 text-center text-[0.8125rem] leading-snug">
        Замовлення до {siteConfig.delivery.sameDayCutoff} доставимо сьогодні по Києву
      </p>
    </div>
  )
}
