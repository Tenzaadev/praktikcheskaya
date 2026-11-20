import { useMemo, useState } from "react";

// Карточка товара: выбор варианта, валидация количества, черновик заказа
export default function ProductDetailPage({
  product,
  enrichedProduct,
  draftItems,
  canOrder,
  onAddToDraft,
  onRemoveDraftItem,
  onConfirmOrder,
  onCancelOrder,
  onBack,
}) {
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState("");

  const selectedVariant = product.variants.find(
    (v) => v.id === selectedVariantId
  );

  const handleVariantSelect = (variant) => {
    if (variant.quantity <= 0) {
      return;
    }
    setSelectedVariantId(variant.id);
    setQuantity("1");
    setError("");
  };

  // Буквы и числа сверх остатка блокируются прямо при вводе
  const handleQuantityChange = (e) => {
    const raw = e.target.value;

    if (!/^\d*$/.test(raw)) {
      setError("Введите целое положительное число.");
      return;
    }

    if (!selectedVariant) {
      setError("Сначала выберите вариант.");
      return;
    }

    const num = Number(raw);
    if (num <= 0 && raw !== "") {
      setError("Количество должно быть больше нуля.");
      return;
    }

    if (num > selectedVariant.quantity) {
      setError(`Доступно не более ${selectedVariant.quantity} шт.`);
      return;
    }

    setError("");
    setQuantity(raw);
  };

  const handleAdd = () => {
    if (!selectedVariant) {
      setError("Выберите размер/вариант.");
      return;
    }

    const num = Number(quantity);
    if (!num || num <= 0) {
      setError("Введите корректное количество.");
      return;
    }

    if (num > selectedVariant.quantity) {
      setError(`Доступно не более ${selectedVariant.quantity} шт.`);
      return;
    }

    // Учитываем позиции, уже добавленные в черновик
    const existing = draftItems.find(
      (i) => i.variant_id === selectedVariant.id
    );
    const alreadyInDraft = existing ? existing.quantity : 0;

    if (alreadyInDraft + num > selectedVariant.quantity) {
      setError(
        `С учётом черновика доступно не более ${
          selectedVariant.quantity - alreadyInDraft
        } шт.`
      );
      return;
    }

    onAddToDraft({
      variant_id: selectedVariant.id,
      product_id: product.id,
      product_name: product.name,
      manufacturer_name: product.manufacturer_name,
      size: selectedVariant.size,
      quantity: num,
      unit_price: enrichedProduct.discountedPrice,
    });

    setQuantity("1");
    setError("");
  };

  const draftTotal = useMemo(
    () => draftItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0),
    [draftItems]
  );

  return (
    <div>
      <div className="page-bar">
        <h1>
          {product.manufacturer_name} | {product.name}
        </h1>
        <button type="button" className="btn" onClick={onBack}>
          ← Назад
        </button>
      </div>

      <div className="panel">
        <div className="detail-grid">
          <img
            className="detail-image"
            src={product.image || "/picture.png"}
            alt={product.name}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/picture.png";
            }}
          />
          <div>
            <p>
              <strong>Категория:</strong> {enrichedProduct.categoryName}
            </p>
            <p>
              <strong>Состав:</strong> {product.composition}
            </p>
            <p>
              <strong>Описание:</strong> {product.description}
            </p>
            <p>
              <strong>Остаток:</strong> {enrichedProduct.stockLabel} (
              {enrichedProduct.totalStock} шт.)
            </p>
            <p>
              <strong>Цена:</strong>{" "}
              {enrichedProduct.discountPercent > 0 && (
                <span className="price-old">{product.base_price} ₽ </span>
              )}
              <span className="price-current">
                {enrichedProduct.discountedPrice} ₽
              </span>
              {enrichedProduct.discountPercent > 0 && (
                <span className="discount-badge" style={{ marginLeft: 8 }}>
                  Скидка −{enrichedProduct.discountPercent}%
                </span>
              )}
            </p>

            <h3 style={{ marginTop: 20 }}>Выберите размер:</h3>
            <div className="size-buttons">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className={`size-btn ${
                    selectedVariantId === v.id ? "active" : ""
                  }`}
                  disabled={v.quantity <= 0}
                  onClick={() => handleVariantSelect(v)}
                >
                  {v.size} {v.quantity <= 0 ? "(нет)" : `(${v.quantity} шт.)`}
                </button>
              ))}
            </div>

            {canOrder ? (
              <>
                <label htmlFor="qty-input">
                  <strong>Количество:</strong>
                </label>
                <input
                  id="qty-input"
                  className="input"
                  value={quantity}
                  onChange={handleQuantityChange}
                  style={{ maxWidth: 120, marginLeft: 8 }}
                />
                {error && (
                  <div
                    className="field-hint"
                    style={{ color: "#b91c1c", marginTop: 6 }}
                  >
                    {error}
                  </div>
                )}

                <div style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleAdd}
                  >
                    Добавить в заказ
                  </button>
                </div>
              </>
            ) : (
              <div className="field-hint" style={{ marginTop: 12 }}>
                Чтобы оформить заказ, войдите в систему.
              </div>
            )}
          </div>
        </div>
      </div>

      {canOrder && (
        <div className="panel">
          <h3>Черновик заказа ({draftItems.length} поз.)</h3>
          {draftItems.length === 0 ? (
            <p>Пока ничего не добавлено.</p>
          ) : (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>Товар</th>
                    <th>Вариант</th>
                    <th>Кол-во</th>
                    <th>Цена</th>
                    <th>Сумма</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {draftItems.map((item, idx) => (
                    <tr key={`${item.variant_id}-${idx}`}>
                      <td>
                        {item.manufacturer_name} | {item.product_name}
                      </td>
                      <td>{item.size}</td>
                      <td>{item.quantity}</td>
                      <td>{item.unit_price} ₽</td>
                      <td>{item.unit_price * item.quantity} ₽</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => onRemoveDraftItem(idx)}
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p>
                <strong>Итого: {draftTotal} ₽</strong>
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onConfirmOrder}
                >
                  Подтвердить заказ
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={onCancelOrder}
                >
                  Отменить
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
