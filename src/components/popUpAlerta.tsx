import "./popUpAlerta.css";

type PopUpAlertaProps = {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function PopUpAlerta({
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}: PopUpAlertaProps) {
  return (
    <div className="popup-alert-overlay" role="presentation" onClick={(event) => {
      event.stopPropagation();
      onCancel();
    }}>
      <section
        className="popup-alert-card"
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="popup-alert-actions">
          <button type="button" className="popup-alert-cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button type="button" className="popup-alert-confirm" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </section>
    </div>
  );
}
