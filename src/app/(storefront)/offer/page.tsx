import type { Metadata } from "next"
import Link from "next/link"

import { Detail, LegalPage, LegalSection } from "@/components/legal/legal-page"
import { legalDetails, legalDetailsComplete } from "@/config/legal"
import { siteConfig } from "@/config/site"
import { pageOpenGraph } from "@/lib/metadata"
import { canonicalPath } from "@/lib/structured-data"

export const metadata: Metadata = {
  title: "Публічна оферта",
  description: `Умови замовлення товарів на сайті ${siteConfig.name}: оформлення, ціна, оплата й доставка.`,
  alternates: { canonical: canonicalPath("/offer") },
  openGraph: pageOpenGraph({ title: "Публічна оферта", url: canonicalPath("/offer") }),
  // Not indexed until the owner's legal details are filled in
  robots: legalDetailsComplete ? undefined : { index: false, follow: true },
}

export default function OfferPage() {
  return (
    <LegalPage title="Публічна оферта" path="/offer">
      <p className="mt-6">
        Цей документ описує умови, на яких продавець пропонує придбати товари, представлені на сайті{" "}
        {siteConfig.name}.
      </p>

      <LegalSection title="1. Загальні положення">
        <p>
          Продавець — <Detail value={legalDetails.sellerName} missing="найменування або ПІБ продавця" />,{" "}
          <Detail value={legalDetails.sellerRegistration} missing="форма та реєстраційний номер" />.
        </p>
        <p>
          Оформлюючи замовлення на сайті, покупець підтверджує, що ознайомився з цими умовами та погоджується з ними.
        </p>
      </LegalSection>

      <LegalSection title="2. Товар і ціна">
        <ul>
          <li>Опис, склад і ціна кожного товару вказані на його сторінці. Ціни наведені в гривнях.</li>
          <li>Ціна товару в замовленні фіксується на момент його оформлення.</li>
          <li>Вартість доставки не входить у ціну товару та узгоджується окремо.</li>
          <li>
            Біля товару вказано його доступність: «В наявності», «Під замовлення» або «Немає в наявності». Товар,
            якого немає в наявності, замовити не можна.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Оформлення замовлення">
        <ul>
          <li>Покупець додає товари в кошик і вказує ім&apos;я, номер телефону та місто; за бажанням залишає коментар.</li>
          <li>Реєстрація на сайті не потрібна.</li>
          <li>Після оформлення покупець бачить номер замовлення.</li>
          <li>
            Менеджер зв&apos;язується з покупцем у Telegram за вказаним номером телефону й узгоджує адресу, дату та час
            доставки, її вартість і спосіб оплати.
          </li>
          <li>Замовлення вважається підтвердженим після такого узгодження.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Оплата">
        <p>Онлайн-оплати на сайті немає. Спосіб оплати покупець узгоджує з менеджером.</p>
        <p>
          Доступні способи оплати: <Detail value={legalDetails.paymentMethods} missing="способи оплати" />.
        </p>
      </LegalSection>

      <LegalSection title="5. Доставка">
        <p>
          Доставка здійснюється по всій Україні. Спосіб, строк і вартість доставки залежать від міста та узгоджуються з
          менеджером для кожного замовлення.
        </p>
      </LegalSection>

      <LegalSection title="6. Повернення та обмін">
        <p>
          <Detail value={legalDetails.returnsPolicy} missing="умови повернення та обміну" />
        </p>
        <p>Права покупця як споживача визначаються законодавством України про захист прав споживачів.</p>
      </LegalSection>

      <LegalSection title="7. Персональні дані">
        <p>
          Дані, які покупець вказує під час оформлення замовлення, обробляються відповідно до{" "}
          <Link href="/privacy">політики конфіденційності</Link>.
        </p>
      </LegalSection>

      <LegalSection title="8. Реквізити продавця">
        <ul>
          <li>
            Продавець: <Detail value={legalDetails.sellerName} missing="найменування або ПІБ продавця" />
          </li>
          <li>
            Реєстраційні дані: <Detail value={legalDetails.sellerRegistration} missing="форма та реєстраційний номер" />
          </li>
          <li>
            Адреса: <Detail value={legalDetails.sellerAddress} missing="адреса продавця" />
          </li>
          <li>
            Контакт: <Detail value={legalDetails.contact} missing="контакт для звернень" />
          </li>
        </ul>
        <p>
          Редакція чинна з: <Detail value={legalDetails.effectiveDate} missing="дата набрання чинності" />.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
