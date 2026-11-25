import React from "react";
import Modal from "./Modal";

/**
 * Branded destructive/confirmation dialog.
 * Controlled by the caller: pass `open` and handle `onConfirm` / `onCancel`.
 */
const ConfirmDialog = ({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Never mind",
  tone = "danger",
  loading = false,
  onConfirm,
  onCancel,
  icon,
}) => (
  <Modal
    isOpen={open}
    onClose={onCancel}
    size="sm"
    hideHeader
    ariaLabel={title}
    dismissible={!loading}
    panelClassName="ui-confirm-panel"
    footer={
      <div className="ui-confirm__actions" style={{ marginTop: 0 }}>
        <button type="button" className="ui-btn ui-btn--ghost" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={`ui-btn ${tone === "danger" ? "ui-btn--danger" : "ui-btn--primary"}`}
          onClick={onConfirm}
          disabled={loading}
          data-autofocus
        >
          {loading && <span className="ui-spinner" aria-hidden="true" />}
          {loading ? "Working…" : confirmLabel}
        </button>
      </div>
    }
  >
    <div className="ui-confirm">
      <span className={`ui-confirm__icon ${tone === "gold" ? "ui-confirm__icon--gold" : ""}`} aria-hidden="true">
        {icon || "✕"}
      </span>
      <h2 className="ui-confirm__title">{title}</h2>
      {message && <p className="ui-confirm__text">{message}</p>}
    </div>
  </Modal>
);

export default ConfirmDialog;
