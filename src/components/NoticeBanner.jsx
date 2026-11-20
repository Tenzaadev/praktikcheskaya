// Единый баннер уведомлений: ошибка / предупреждение / информация
const ICONS = { error: "⚠️", warning: "❗", info: "ℹ️" };

export default function NoticeBanner({ notice, onClose }) {
  if (!notice) {
    return null;
  }

  return (
    <div className={`notice notice-${notice.type}`}>
      <div className="notice-body">
        <span className="notice-icon">{ICONS[notice.type] || "ℹ️"}</span>
        <div>
          <strong>{notice.title}: </strong>
          <span>{notice.message}</span>
        </div>
      </div>
      <button type="button" className="btn" onClick={onClose}>
        Закрыть
      </button>
    </div>
  );
}
