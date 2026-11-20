import { useState } from "react";
import { calculateOrderTotal } from "../utils/catalogLogic";

// Экран управления заказами: список, добавление, удаление.
// Кнопки редактирования даты и удаления позиции видны только администратору.
export default function OrdersPage({
  orders,
  users,
  user,
  targetClient,
  onSetTargetClient,
  onStartNewOrder,
  onDeleteOrder,
  onDeleteItem,
  onEditDate,
  onBack,
}) {
  const isAdmin = user?.role_code === "admin";
  const clients = users.filter((u) => u.role_code === "client");
  const [showClientPicker, setShowClientPicker] = useState(false);

  const handleStartNewOrder = (clientId) => {
    const client = users.find((u) => u.id === Number(clientId));
    onSetTargetClient(client);
    setShowClientPicker(false);
    onStartNewOrder();
  };

  return (
    <div>
      <div className="page-bar">
        <h1>Управление заказами ({user.role_name})</h1>
        <button type="button" className="btn" onClick={onBack}>
          ← Назад
        </button>
      </div>

      <div className="panel">
        {!showClientPicker ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowClientPicker(true)}
          >
            + Добавить заказ
          </button>
        ) : (
          <div>
            <p>
              <strong>Выберите клиента для нового заказа:</strong>
            </p>
            <select
              className="select"
              defaultValue={targetClient?.id || ""}
              onChange={(e) => handleStartNewOrder(e.target.value)}
            >
              <option value="">— выберите —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.login})
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn"
              style={{ marginLeft: 8 }}
              onClick={() => setShowClientPicker(false)}
            >
              Отмена
            </button>
          </div>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="panel">Заказов пока нет.</div>
      ) : (
        orders.map((order) => (
          <div className="panel" key={order.id}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <div>
                <strong>Заказ №{order.id}</strong> от{" "}
                {isAdmin ? (
                  <input
                    type="date"
                    className="input"
                    value={order.order_date}
                    onChange={(e) => onEditDate(order.id, e.target.value)}
                    style={{ maxWidth: 160, display: "inline-block" }}
                  />
                ) : (
                  <span>{order.order_date}</span>
                )}{" "}
                — {order.client_full_name}
              </div>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => onDeleteOrder(order.id)}
              >
                Удалить заказ
              </button>
            </div>

            <table className="table">
              <thead>
                <tr>
                  <th>Производитель | Наименование</th>
                  <th>Вариант</th>
                  <th>Кол-во</th>
                  <th>Цена</th>
                  <th>Сумма</th>
                  {isAdmin && <th></th>}
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.manufacturer_name} | {item.product_name}
                    </td>
                    <td>{item.size}</td>
                    <td>{item.quantity}</td>
                    <td>{item.unit_price} ₽</td>
                    <td>{item.unit_price * item.quantity} ₽</td>
                    {isAdmin && (
                      <td>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => onDeleteItem(order.id, item.id)}
                        >
                          Удалить позицию
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <p>
              <strong>Итого: {calculateOrderTotal(order)} ₽</strong>
            </p>
          </div>
        ))
      )}
    </div>
  );
}
