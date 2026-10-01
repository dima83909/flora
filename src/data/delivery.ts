/*
 * Delivery works across Ukraine. Address, date, time, delivery cost and payment
 * are agreed with each customer in Telegram after the order is placed, so the
 * site shows how it works rather than fixed zones or prices.
 */

export const deliverySteps = [
  {
    title: "Ви оформлюєте замовлення",
    text: "Обираєте букет і залишаєте ім'я, телефон і місто.",
  },
  {
    title: "Менеджер пише вам у Telegram",
    text: "Разом узгоджуєте адресу, дату й час, вартість доставки та спосіб оплати.",
  },
  {
    title: "Букет вирушає до вас",
    text: "Доставляємо по всій Україні у спосіб і час, які ми з вами узгодили.",
  },
]

/** What the manager agrees with the customer in Telegram */
export const agreedInTelegram = [
  "Адресу доставки",
  "Дату й зручний час",
  "Вартість доставки до вашого міста",
  "Спосіб оплати",
]
