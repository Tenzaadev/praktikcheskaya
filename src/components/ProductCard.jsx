import { useState } from "react";

// Карточка товара в каталоге (3-колоночный макет) с заглушкой /picture.png
export default function ProductCard({ product, onSelect }) {
  const [imgError, setImgError] = useState(false);

  const imgSrc = !imgError && product.image ? product.image : "/picture.png";
  const cardClass = product.isLowStock
    ? "product-card low-stock"
    : "product-card";

  // onError сбрасывается, чтобы при отсутствии и заглушки не было цикла
  const handleImageError = (event) => {
    event.currentTarget.onerror = null;
    setImgError(true);
  };

  return (
    <article className={cardClass} onClick={() => onSelect(product.id)}>
      <img
        className="product-thumb"
        src={imgSrc}
        alt={product.name}
        onError={handleImageError}
      />
      <div>
        <h3 className="product-title">
          {product.manufacturer_name} | {product.name}
        </h3>
        <div className="product-meta">
          <span>Категория: {product.categoryName}</span>
          <span>Количество: {product.stockLabel}</span>
          <span>Состав: {product.composition}</span>
        </div>
      </div>
      <div className="product-price-col">
        {product.discountPercent > 0 && (
          <span className="price-old">{product.base_price} ₽</span>
        )}
        <span className="price-current">{product.discountedPrice} ₽</span>
        {product.discountPercent > 0 && (
          <span className="discount-badge">
            Скидка −{product.discountPercent}%
          </span>
        )}
      </div>
    </article>
  );
}
