import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Accessible confirmation dialog used for destructive actions. Focus moves
 * to the confirm button on open and back to the previously-focused element
 * on close. Esc cancels; Enter (when confirm is focused) confirms.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previouslyFocused.current?.focus();
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="nv-dialog-backdrop" onClick={onCancel} role="presentation">
      <div
        className="nv-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nv-dialog-title"
        aria-describedby="nv-dialog-msg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="nv-dialog-title">{title}</h3>
        <p id="nv-dialog-msg">{message}</p>
        <div className="nv-dialog-actions">
          <button type="button" className="nv-btn" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={destructive ? "nv-btn nv-btn-danger" : "nv-btn nv-btn-primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
