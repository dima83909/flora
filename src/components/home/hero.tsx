import Link from "next/link"

import { FlowerArt } from "@/components/brand/flower-art"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="overflow-hidden">
      <div className="container-page grid items-center gap-12 pt-10 pb-4 md:pt-16 md:pb-10 lg:grid-cols-12 lg:gap-8 lg:pt-20 lg:pb-28">
        <div className="lg:col-span-6 xl:col-span-6">
          <h1 id="hero-title" className="text-display font-light text-ink">
            Букети з доставкою по всій Україні
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft md:mt-8 md:text-xl md:leading-relaxed">
            Оберіть букет і залиште заявку. Менеджер напише вам у Telegram і узгодить доставку
            та оплату.
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
        </div>
      </div>
    </section>
  )
}
