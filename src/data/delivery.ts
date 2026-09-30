export type DeliveryZone = {
  area: string
  price: number
  time: string
  /** Price is a starting point, final cost agreed with the manager */
  priceFrom?: boolean
}

export const deliveryZones: DeliveryZone[] = [
  { area: "Центр, Поділ, Печерськ", price: 150, time: "від 60 хвилин" },
  { area: "Інші райони правого берега", price: 200, time: "від 90 хвилин" },
  { area: "Лівий берег", price: 250, time: "від 2 годин" },
  { area: "Передмістя до 20 км", price: 450, time: "час узгоджуємо окремо", priceFrom: true },
]

export const deliverySteps = [
  {
    title: "Ви оформлюєте замовлення",
    text: "Обираєте букет і залишаєте ім'я та телефон. Менеджер передзвонить і узгодить адресу, дату, час і оплату.",
  },
  {
    title: "Флорист збирає букет",
    text: "За годину до виїзду надсилаємо фото у Viber або Telegram. Ви підтверджуєте або просите змінити.",
  },
  {
    title: "Кур’єр привозить квіти",
    text: "Букет їде у вертикальній коробці з водою. Після вручення повідомимо, що все отримано.",
  },
]
