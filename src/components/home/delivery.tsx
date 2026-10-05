import { CheckIcon } from "lucide-react"

import { agreedInTelegram, deliverySteps as steps } from "@/data/delivery"

export function Delivery() {
  return (
    <section id="delivery" aria-labelledby="delivery-title" className="section-y scroll-mt-24 bg-moss text-paper">
      <div className="container-page grid gap-14 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-6">
          <h2 id="delivery-title" className="text-title font-light">
            Доставка по всій Україні цілодобово 24/7
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-paper/75">
            Вартість і терміни залежать від міста, тому ми не рахуємо їх автоматично. Після
            оформлення менеджер напише вам у Telegram і все узгодить.
          </p>

          <ol className="mt-12 space-y-8">
            {steps.map((step, index) => (
              <li key={step.title} className="grid grid-cols-[2.5rem_1fr] gap-4">
                <span
                  aria-hidden
                  className="flex size-10 items-center justify-center rounded-full border border-paper/30 font-heading text-lg"
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-sans text-lg font-medium">{step.title}</h3>
                  <p className="mt-1.5 max-w-md text-[0.9375rem] leading-relaxed text-paper/70">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          <div className="rounded-2xl bg-paper/6 p-6 ring-1 ring-paper/15 md:p-8">
            <h3 className="font-sans text-lg font-medium">Що узгодить менеджер</h3>
            <ul className="mt-6 divide-y divide-paper/15">
              {agreedInTelegram.map((item) => (
                <li key={item} className="flex items-center gap-3 py-4 text-[0.9375rem]">
                  <CheckIcon aria-hidden className="size-4 shrink-0 text-blush" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-xl bg-blush px-4 py-3 text-[0.9375rem] leading-snug text-ink">
              Онлайн-оплати на сайті немає: спосіб оплати ви обираєте разом із менеджером.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
