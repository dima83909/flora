import type { Metadata } from "next"
import Link from "next/link"

import { Detail, LegalPage, LegalSection } from "@/components/legal/legal-page"
import { legalDetails, legalDetailsComplete } from "@/config/legal"
import { siteConfig } from "@/config/site"
import { pageOpenGraph } from "@/lib/metadata"
import { canonicalPath } from "@/lib/structured-data"

export const metadata: Metadata = {
  title: "Політика конфіденційності",
  description: `Які дані збирає ${siteConfig.name} під час оформлення замовлення, навіщо вони потрібні та як ними розпорядитися.`,
  alternates: { canonical: canonicalPath("/privacy") },
  openGraph: pageOpenGraph({ title: "Політика конфіденційності", url: canonicalPath("/privacy") }),
  // Not indexed until the owner's legal details are filled in
  robots: legalDetailsComplete ? undefined : { index: false, follow: true },
}

export default function PrivacyPage() {
  return (
    <LegalPage title="Політика конфіденційності" path="/privacy">
      <p className="mt-6">
        Ця політика пояснює, які персональні дані обробляються, коли ви користуєтеся сайтом {siteConfig.name} й
        оформлюєте замовлення.
      </p>

      <LegalSection title="1. Хто обробляє дані">
        <p>
          Володільцем персональних даних є продавець:{" "}
          <Detail value={legalDetails.sellerName} missing="найменування або ПІБ продавця" />,{" "}
          <Detail value={legalDetails.sellerRegistration} missing="форма та реєстраційний номер" />, адреса:{" "}
          <Detail value={legalDetails.sellerAddress} missing="адреса продавця" />.
        </p>
        <p>
          Звернення щодо персональних даних: <Detail value={legalDetails.contact} missing="контакт для звернень" />.
        </p>
      </LegalSection>

      <LegalSection title="2. Які дані ми отримуємо">
        <ul>
          <li>Дані, які ви вказуєте під час оформлення замовлення: ім&apos;я, номер телефону, місто й коментар, якщо ви його залишили.</li>
          <li>Склад замовлення: обрані товари, їх кількість і ціна на момент оформлення.</li>
          <li>
            Технічні дані запиту, зокрема IP-адреса. Їх обробляє хостинг, щоб сайт міг відповісти на запит вашого
            браузера.
          </li>
        </ul>
        <p>Реєстрація на сайті не потрібна, облікові записи покупців не створюються.</p>
      </LegalSection>

      <LegalSection title="3. Що зберігається на вашому пристрої">
        <p>
          Кошик і список обраного зберігаються у сховищі вашого браузера на вашому пристрої. На сервер потрапляє лише
          склад замовлення в момент його оформлення. Рекламних та аналітичних cookie сайт не використовує.
        </p>
      </LegalSection>

      <LegalSection title="4. Навіщо потрібні дані">
        <ul>
          <li>Щоб прийняти й виконати ваше замовлення.</li>
          <li>
            Щоб менеджер зв&apos;язався з вами в Telegram за вказаним номером телефону та узгодив адресу, дату й час
            доставки, її вартість і спосіб оплати.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Кому доступні дані">
        <p>
          Дані бачать лише працівники магазину, які обробляють замовлення. Ми не продаємо персональні дані й не
          передаємо їх для реклами.
        </p>
        <p>
          Технічні постачальники, що забезпечують роботу сайту (хостинг і база даних), обробляють дані за нашим
          дорученням і лише для цих цілей. Спілкування з менеджером відбувається в
          Telegram, де діють правила цього сервісу.
        </p>
      </LegalSection>

      <LegalSection title="6. Скільки зберігаються дані">
        <p>
          <Detail value={legalDetails.dataRetention} missing="строк зберігання даних замовлень" />
        </p>
      </LegalSection>

      <LegalSection title="7. Ваші права">
        <p>
          Відповідно до Закону України «Про захист персональних даних» ви можете дізнатися, які ваші дані
          обробляються, отримати до них доступ, вимагати їх виправлення або видалення, а також відкликати згоду на
          обробку. Для цього напишіть нам:{" "}
          <Detail value={legalDetails.contact} missing="контакт для звернень" />.
        </p>
      </LegalSection>

      <LegalSection title="8. Зміни до політики">
        <p>
          Актуальна редакція завжди опублікована на цій сторінці. Умови замовлення описані в{" "}
          <Link href="/offer">публічній оферті</Link>.
        </p>
        <p>
          Редакція чинна з: <Detail value={legalDetails.effectiveDate} missing="дата набрання чинності" />.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
