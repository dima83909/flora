import { CameraIcon, CalendarHeartIcon, FeatherIcon, SproutIcon, type LucideIcon } from "lucide-react"

type Benefit = {
  icon: LucideIcon
  title: string
  text: string
}

const benefits: Benefit[] = [
  {
    icon: CameraIcon,
    title: "Фото перед доставкою",
    text: "Ви бачите саме свій букет, а не картинку з каталогу. Якщо щось не так, флорист переробить.",
  },
  {
    icon: SproutIcon,
    title: "Свіжість щонайменше 5 днів",
    text: "Якщо квіти зів’януть раніше, привеземо новий букет без доплати. Достатньо надіслати фото.",
  },
  {
    icon: FeatherIcon,
    title: "Листівка від руки",
    text: "Напишемо ваш текст чорнилом на щільному бавовняному папері. Безкоштовно до кожного замовлення.",
  },
  {
    icon: CalendarHeartIcon,
    title: "Нагадаємо про важливі дати",
    text: "Залиште дату дня народження чи річниці, і ми напишемо за три дні, щоб ви встигли замовити.",
  },
]

export function Benefits() {
  return (
    <section aria-labelledby="benefits-title" className="section-y">
      <div className="container-page grid gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5 lg:pr-8">
          <h2 id="benefits-title" className="text-title font-light text-ink">
            Що ви отримуєте разом із букетом
          </h2>
        </div>
        <ul className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:col-span-7 lg:gap-y-14">
          {benefits.map(({ icon: Icon, title, text }) => (
            <li key={title} className="border-t border-border pt-6">
              <Icon aria-hidden className="size-6 text-stem" strokeWidth={1.4} />
              <h3 className="mt-5 font-sans text-lg font-medium text-ink">{title}</h3>
              <p className="mt-2 max-w-sm text-[0.9375rem] leading-relaxed text-ink-soft">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
