import { useEffect, useId, useRef } from "react";
import { FiX } from "react-icons/fi";

export default function ConfirmDialog({ title, onCancel, busy, children }) {
  const dialog = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="af-confirm-dialog"
      aria-labelledby={titleId}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <header>
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          className="af-icon-button"
          aria-label="Cancel update"
          onClick={onCancel}
          disabled={busy}
        >
          <FiX />
        </button>
      </header>
      {children}
    </dialog>
  );
}
