import { useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import { enrichProduct } from "../utils/catalogLogic";

// Экран каталога: совместный поиск, фильтр категорий и сортировка по цене
export default function CatalogPage({
  products,
  categories,
  orders,
  user,
  catalogTitle,
  onSelectProduct,
}) {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [sortBy, setSortBy] = useState("");

  const enrichedProducts = useMemo(
    () => products.map((p) => enrichProduct(p, categories, orders)),
    [products, categories, orders]
  );

  // Три условия применяются последовательно, поэтому ничего не перетирает друг друга
  const visibleProducts = useMemo(() => {
    let result = enrichedProducts;

    if (categoryId !== "all") {
      result = result.filter(
        (item) => String(item.category_id) === categoryId
      );
    }

    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      );
    }

    if (sortBy === "price_asc") {
      result = [...result].sort(
        (a, b) => a.discountedPrice - b.discountedPrice
      );
    } else if (sortBy === "price_desc") {
      result = [...result].sort(
        (a, b) => b.discountedPrice - a.discountedPrice
      );
    }

    return result;
  }, [enrichedProducts, categoryId, search, sortBy]);

  return (
    <div>
      <div className="page-bar">
        <h1>{catalogTitle}</h1>
      </div>

      {/* Панель управления видна только авторизованному пользователю */}
      {user && (
        <div className="filters-bar">
          <input
            className="input"
            placeholder="Поиск по названию и описанию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="select"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="all">Все категории</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className="select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="">Без сортировки</option>
            <option value="price_asc">Цена: по возрастанию</option>
            <option value="price_desc">Цена: по убыванию</option>
          </select>
        </div>
      )}

      {visibleProducts.length === 0 ? (
        <div className="panel">Товары не найдены.</div>
      ) : (
        <div className="catalog-list">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      )}
    </div>
  );
}
