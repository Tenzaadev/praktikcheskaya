import { useState } from "react";

// Экран входа: только поле логина, без пароля
export default function LoginPage({ users, onLogin, onBack }) {
  const [loginInput, setLoginInput] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleaned = loginInput.trim();

    if (!cleaned) {
      setError("Введите логин пользователя.");
      return;
    }

    const found = users.find((u) => u.login === cleaned);
    if (!found) {
      setError("Пользователь с таким логином не найден.");
      return;
    }

    onLogin(found);
  };

  return (
    <div className="panel login-box">
      <div className="page-bar">
        <h1>Авторизация</h1>
        <button type="button" className="btn" onClick={onBack}>
          ← Назад
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <label htmlFor="login-input">
          <strong>Логин пользователя:</strong>
        </label>
        <input
          id="login-input"
          className="input"
          value={loginInput}
          onChange={(e) => {
            setLoginInput(e.target.value);
            setError("");
          }}
          placeholder="client1, manager1, admin1"
          style={{ marginTop: 8 }}
        />
        {error && (
          <div className="field-hint" style={{ color: "#b91c1c", marginTop: 6 }}>
            {error}
          </div>
        )}
        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: "100%", marginTop: 12 }}
        >
          Войти
        </button>
        <div className="field-hint" style={{ marginTop: 10 }}>
          Доступные логины: <strong>client1</strong>, <strong>client2</strong>,{" "}
          <strong>manager1</strong>, <strong>admin1</strong>
        </div>
      </form>
    </div>
  );
}
