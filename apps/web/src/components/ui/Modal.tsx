import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Content max-width. "md" (default, 42rem) suits forms/confirmations;
   * "xl" (56rem) gives wide content — like an A4-proportioned template
   * render — enough room to sit at a comfortable, legible scale on typical
   * desktop widths without horizontal overflow. */
  size?: "md" | "xl";
}

const SIZE_CLASSES: Record<NonNullable<ModalProps["size"]>, string> = {
  md: "max-w-2xl",
  xl: "max-w-4xl",
};

/** position:fixed + viewport-centered by construction — this is the direct
 * fix for the reference product's confirmed defect where the template
 * preview overlay opened anchored to the document top instead of the
 * viewport when the page was scrolled (features/17). Every overlay in the
 * app (photo cropper, template preview, section "add" confirmations) should
 * use this instead of a bespoke absolutely-positioned div. */
export function Modal({ open, onClose, title, children, size = "md" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-navy-deep/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative z-10 max-h-[90vh] w-full ${SIZE_CLASSES[size]} overflow-y-auto overflow-x-hidden rounded-lg bg-surface-card p-6 shadow-xl`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-heading">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-text-muted hover:bg-surface-sunken"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
