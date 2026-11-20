import { useEffect, useState } from "react";
import rawMockData from "./data/mockData.json";
import { loadFromStorage, saveToStorage } from "./services/storage";
import { calculateOrderTotal, enrichProduct } from "./utils/catalogLogic";
import Header from "./components/Header";
import NoticeBanner from "./components/NoticeBanner";
import CatalogPage from "./pages/CatalogPage";
import LoginPage from "./pages/LoginPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import OrdersPage from "./pages/OrdersPage";

// Выберите ваш вариант: "variantA" (обувь) или "variantB" (спортинвентарь)
const ACTIVE_VARIANT = "variantA";
const STORAGE_KEY = `pr_de_state_${ACTIVE_VARIANT}`;
const dataset = rawMockData[ACTIVE_VARIANT];
const COMPANY_NAME = dataset.companyName;

const PAGE_TITLES = {
  catalog: `${COMPANY_NAME} — ${dataset.catalogTitle}`,
  detail: `${COMPANY_NAME} — Карточка товара`,
  login: `${COMPANY_NAME} — Авторизация`,
  orders: `${COMPANY_NAME} — Управление заказами`,
};

// Начальное состояние: localStorage или стартовые данные из mockData.json
function loadInitialState() {
  return loadFromStorage(STORAGE_KEY, {
    products: dataset.products,
    orders: dataset.orders,
  });
}

export default function App() {
  const [initialState] = useState(loadInitialState);
  const [products, setProducts] = useState(initialState.products);
  const [orders, setOrders] = useState(initialState.orders);
  const users = dataset.users;
  const categories = dataset.categories;

  const [user, setUser] = useState(null);
  const [targetClient, setTargetClient] = useState(null);

  // Навигация между экранами
  const [screen, setScreen] = useState("catalog");
  const [prevScreen, setPrevScreen] = useState("catalog");
  const [returnAfterOrder, setReturnAfterOrder] = useState("catalog");
  const [selectedProductId, setSelectedProductId] = useState(null);

  const [draftItems, setDraftItems] = useState([]);
  const [notice, setNotice] = useState(null);

  // Динамический заголовок вкладки
  useEffect(() => {
    document.title = PAGE_TITLES[screen] || COMPANY_NAME;
  }, [screen]);

  // Сохранение товаров и заказов при любых изменениях
  useEffect(() => {
    saveToStorage(STORAGE_KEY, { products, orders });
  }, [products, orders]);

  const navigateTo = (next) => {
    setPrevScreen(screen);
    setScreen(next);
  };

  const handleBack = () => {
    setScreen(prevScreen || "catalog");
  };

  const handleLogin = (foundUser) => {
    setUser(foundUser);
    setTargetClient(foundUser);
    setScreen("catalog");
    setNotice({
      type: "info",
      title: "Вход выполнен",
      message: `Добро пожаловать, ${foundUser.full_name} (${foundUser.role_name}).`,
    });
  };

  const handleLogout = () => {
    setUser(null);
    setTargetClient(null);
    setDraftItems([]);
    setScreen("catalog");
    setNotice(null);
  };

  const handleSelectProduct = (productId) => {
    setSelectedProductId(productId);
    setPrevScreen(screen);
    setScreen("detail");
  };

  const handleAddToDraft = (item) => {
    setDraftItems((prev) => [...prev, item]);
    setNotice({
      type: "info",
      title: "Добавлено",
      message: `${item.manufacturer_name} | ${item.product_name}, размер ${item.size}, ${item.quantity} шт.`,
    });
  };

  const handleRemoveDraftItem = (index) => {
    setDraftItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCancelOrder = () => {
    setDraftItems([]);
    setNotice({
      type: "warning",
      title: "Заказ отменён",
      message: "Черновик заказа очищен.",
    });
  };

  // Подтверждение заказа: новый заказ + иммутабельное списание остатков
  const handleConfirmOrder = () => {
    if (!user || draftItems.length === 0) {
      return;
    }

    const orderOwner = targetClient || user;
    const nextOrderId =
      orders.length > 0
        ? Math.max(...orders.map((o) => o.id)) + 1
        : 1;

    const newOrder = {
      id: nextOrderId,
      user_id: orderOwner.id,
      client_full_name: orderOwner.full_name,
      order_date: new Date().toISOString().slice(0, 10),
      items: draftItems.map((item, index) => ({
        id: Date.now() + index,
        ...item,
      })),
    };

    // Копируем массивы и объекты — прямая мутация не перерисует каталог
    const updatedProducts = products.map((product) => {
      const relevant = draftItems.filter((i) => i.product_id === product.id);
      if (relevant.length === 0) {
        return product;
      }
      const updatedVariants = product.variants.map((v) => {
        const ordered = relevant.find((i) => i.variant_id === v.id);
        if (!ordered) {
          return v;
        }
        return { ...v, quantity: v.quantity - ordered.quantity };
      });
      return { ...product, variants: updatedVariants };
    });

    setProducts(updatedProducts);
    setOrders((prev) => [newOrder, ...prev]);
    setDraftItems([]);
    setNotice({
      type: "info",
      title: "Заказ оформлен",
      message: `Заказ №${newOrder.id} на сумму ${calculateOrderTotal(newOrder)} ₽ создан.`,
    });

    setScreen(returnAfterOrder);
    setReturnAfterOrder("catalog");
  };

  // Удаление всего заказа с возвратом остатков на склад
  const handleDeleteOrder = (orderId) => {
    if (!window.confirm("Удалить заказ? Остатки вернутся на склад.")) {
      return;
    }
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      return;
    }

    const updatedProducts = products.map((product) => {
      const relevant = order.items.filter((i) => i.product_id === product.id);
      if (relevant.length === 0) {
        return product;
      }
      const updatedVariants = product.variants.map((v) => {
        const ordered = relevant.find((i) => i.variant_id === v.id);
        if (!ordered) {
          return v;
        }
        return { ...v, quantity: v.quantity + ordered.quantity };
      });
      return { ...product, variants: updatedVariants };
    });

    setProducts(updatedProducts);
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    setNotice({
      type: "info",
      title: "Заказ удалён",
      message: `Заказ №${orderId} удалён, остатки возвращены.`,
    });
  };

  // Удаление одной позиции (только администратор) с возвратом остатка
  const handleDeleteItem = (orderId, itemId) => {
    if (!window.confirm("Удалить позицию? Остаток вернётся на склад.")) {
      return;
    }
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      return;
    }
    const item = order.items.find((i) => i.id === itemId);
    if (!item) {
      return;
    }

    const updatedProducts = products.map((product) => {
      if (product.id !== item.product_id) {
        return product;
      }
      const updatedVariants = product.variants.map((v) =>
        v.id === item.variant_id
          ? { ...v, quantity: v.quantity + item.quantity }
          : v
      );
      return { ...product, variants: updatedVariants };
    });

    const updatedOrders = orders
      .map((o) => {
        if (o.id !== orderId) {
          return o;
        }
        const remaining = o.items.filter((i) => i.id !== itemId);
        return remaining.length === 0 ? null : { ...o, items: remaining };
      })
      .filter(Boolean);

    setProducts(updatedProducts);
    setOrders(updatedOrders);
    setNotice({
      type: "info",
      title: "Позиция удалена",
      message: "Остаток возвращён на склад.",
    });
  };

  // Изменение даты заказа (только администратор)
  const handleEditDate = (orderId, newDate) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, order_date: newDate } : o))
    );
  };

  const canManageOrders =
    user !== null &&
    (user.role_code === "manager" || user.role_code === "admin");

  const currentProduct = selectedProductId
    ? products.find((p) => p.id === selectedProductId)
    : null;

  return (
    <div>
      <Header
        companyName={COMPANY_NAME}
        user={user}
        canManageOrders={canManageOrders}
        onNavigate={navigateTo}
        onLogout={handleLogout}
      />

      <main className="container">
        <NoticeBanner notice={notice} onClose={() => setNotice(null)} />

        {screen === "login" && (
          <LoginPage users={users} onLogin={handleLogin} onBack={handleBack} />
        )}

        {screen === "catalog" && (
          <CatalogPage
            products={products}
            categories={categories}
            orders={orders}
            user={user}
            catalogTitle={dataset.catalogTitle}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {screen === "detail" && currentProduct && (
          <ProductDetailPage
            product={currentProduct}
            enrichedProduct={enrichProduct(currentProduct, categories, orders)}
            draftItems={draftItems}
            canOrder={user !== null}
            onAddToDraft={handleAddToDraft}
            onRemoveDraftItem={handleRemoveDraftItem}
            onConfirmOrder={handleConfirmOrder}
            onCancelOrder={handleCancelOrder}
            onBack={handleBack}
          />
        )}

        {screen === "orders" && canManageOrders && (
          <OrdersPage
            orders={orders}
            users={users}
            user={user}
            targetClient={targetClient}
            onSetTargetClient={setTargetClient}
            onStartNewOrder={() => {
              setReturnAfterOrder("orders");
              setScreen("catalog");
            }}
            onDeleteOrder={handleDeleteOrder}
            onDeleteItem={handleDeleteItem}
            onEditDate={handleEditDate}
            onBack={handleBack}
          />
        )}
      </main>
    </div>
  );
}
