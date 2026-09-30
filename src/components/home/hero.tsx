import Link from "next/link"

import { FlowerArt } from "@/components/brand/flower-art"
import { Button } from "@/components/ui/button"
import { weeklyStems } from "@/data/studio"

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="overflow-hidden">
      <div className="container-page grid items-center gap-12 pt-10 pb-4 md:pt-16 md:pb-10 lg:grid-cols-12 lg:gap-8 lg:pt-20 lg:pb-28">
        <div className="lg:col-span-6 xl:col-span-6">
          <h1 id="hero-title" className="text-display font-light text-ink">
            Букети з квітів, що приїхали цього тижня
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft md:mt-8 md:text-xl md:leading-relaxed">
            Збираємо вручну в майстерні на Ярославовому Валу. Перед доставкою надсилаємо
            фото саме вашого букета, щоб ви бачили, що отримає адресат.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row md:mt-10">
            <Button asChild size="lg">
              <Link href="/bouquets">Обрати букет</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent">
              <Link href="#delivery">Умови доставки</Link>
            </Button>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:col-span-5 lg:col-start-8 lg:max-w-none">
          <div className="arch animate-bloom aspect-4/5 overflow-hidden">
            <FlowerArt
              variant="hero"
              label="Ілюстрація букета з півоній, троянд, гортензії та евкаліпта в крафтовому папері"
            />
          </div>

          <aside
            aria-labelledby="weekly-stems-title"
            className="relative mx-5 -mt-14 rounded-xl border border-border/80 bg-card p-5 shadow-[0_24px_48px_-28px_rgba(46,59,43,0.45)] sm:absolute sm:bottom-8 sm:-left-12 sm:mx-0 sm:mt-0 sm:w-64 xl:-left-24"
          >
            <h2 id="weekly-stems-title" className="text-lg font-normal text-ink">
              Цього тижня в майстерні
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-snug text-ink-soft">
              {weeklyStems.map((stem) => (
                <li key={stem} className="flex gap-2.5">
                  <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-rose" />
                  {stem}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  )
}
