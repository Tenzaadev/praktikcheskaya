// Чистая бизнес-логика каталога: скидки, остатки, суммы заказов

// Есть ли у товара заказы за прошлый календарный месяц.
// new Date(year, month - 1, 1) корректно переходящ через январь:
// для января прошлым месяцем становится декабрь прошлого года.
export function hasOrdersInPreviousMonth(productId, orders, today = new Date()) {
  const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const targetYear = prevMonthDate.getFullYear();
  const targetMonth = prevMonthDate.getMonth();

  return orders.some((order) => {
    const orderDate = new Date(order.order_date);
    const samePrevMonth =
      orderDate.getFullYear() === targetYear &&
      orderDate.getMonth() === targetMonth;
    if (!samePrevMonth) {
      return false;
    }
    return order.items.some((item) => item.product_id === productId);
  });
}

// Обогащение товара: остаток, метка «много/мало», подсветка, скидка 25%
export function enrichProduct(product, categories, orders) {
  const totalStock = product.variants.reduce((sum, v) => sum + v.quantity, 0);
  const hasPrevOrders = hasOrdersInPreviousMonth(product.id, orders);
  const discountPercent = hasPrevOrders ? 0 : 25;
  const discountedPrice = Math.round(
    product.base_price * (1 - discountPercent / 100)
  );
  const category = categories.find((c) => c.id === product.category_id);

  return {
    ...product,
    categoryName: category ? category.name : "Без категории",
    totalStock,
    stockLabel: totalStock > 5 ? "много" : "мало",
    isLowStock: totalStock <= 3,
    discountPercent,
    discountedPrice,
  };
}

// Итоговая сумма заказа по всем позициям
export function calculateOrderTotal(order) {
  return order.items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );
}
