import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { legalDetailsComplete } from "@/config/legal"

/** A legal detail, or a visible marker while the owner has not provided it */
export function Detail({ value, missing }: { value: string | undefined; missing: string }) {
  if (value) return <>{value}</>
  return <mark className="rounded bg-petal px-1 text-ink">[потрібно вказати: {missing}]</mark>
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-sans text-xl font-medium text-ink">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

type LegalPageProps = {
  title: string
  path: string
  children: React.ReactNode
}

export function LegalPage({ title, path, children }: LegalPageProps) {
  return (
    <div className="container-page pt-6 pb-20 md:pt-8 md:pb-28">
      <Breadcrumbs
        items={[
          { name: "Головна", href: "/" },
          { name: title, href: path },
        ]}
      />
      <article className="max-w-3xl text-[0.9375rem] leading-relaxed text-ink-soft md:text-base [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">
        <h1 className="mt-6 text-title font-light text-ink md:mt-10">{title}</h1>
        {legalDetailsComplete ? null : (
          <p role="note" className="mt-6 rounded-xl bg-linen px-4 py-3 text-sm text-ink">
            Документ готується до публікації: реквізити продавця та окремі умови, позначені в тексті, ще
            не заповнені.
          </p>
        )}
        {children}
      </article>
    </div>
  )
}
