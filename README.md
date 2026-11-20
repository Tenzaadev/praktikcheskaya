# ПР ДЭ (React) — Каталог, заказы и роли

Автономное React-приложение (Vite + JavaScript) с мок-данными и localStorage.

**Вариант:** А — магазин обуви «СтепМаркет» (`variantA`).

## Запуск

```bash
npm install
npm run dev
```

## Тестовые логины

| Логин | Роль |
|-------|------|
| `client1` | Клиент |
| `client2` | Клиент |
| `manager1` | Менеджер |
| `admin1` | Администратор |

## Реализовано

- Каталог 3-колоночный по макету, скидка 25%, «много/мало», красная подсветка при ≤3, заглушка `/picture.png`
- Вход по логину, ФИО в шапке, кнопка «Назад», динамический `document.title`
- Поиск + фильтр категорий («Все категории») + сортировка по цене — работают совместно в реальном времени
- Карточка товара: выбор размера, валидация количества, черновик, подтверждение/отмена, списание остатков
- Заказы: список, добавление, удаление, права admin (дата, удаление позиции с возвратом остатков)
- Состояние товаров и заказов хранится в localStorage

## Структура

```
src/
├── data/mockData.json          # мок-данные (variantA / variantB)
├── services/storage.js         # чтение/запись localStorage
├── utils/catalogLogic.js       # скидки, остатки, суммы
├── components/                 # Header, NoticeBanner, ProductCard
├── pages/                      # Catalog, Login, ProductDetail, Orders
├── styles/app.css
├── App.jsx
└── main.jsx
```

## Сброс данных

DevTools → Application → Local Storage → удалить ключ `pr_de_state_variantA` → F5.
