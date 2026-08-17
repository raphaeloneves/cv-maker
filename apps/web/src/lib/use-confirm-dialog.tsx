import { useCallback, useState, type ReactNode } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { t } from "@/i18n";
import { useBuilderLocale } from "@/lib/use-builder-locale.js";

interface ConfirmOptions {
  title?: string;
  message: string;
  destructive?: boolean;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

/**
 * Promise-based replacement for the browser's native `confirm()` — resolves
 * `true`/`false` the same way, but renders the shared `<ConfirmDialog>`
 * instead of a blocking native dialog. Usage:
 *
 *   const { confirm, dialog } = useConfirmDialog();
 *   // ...
 *   if (!(await confirm({ message: "…" }))) return;
 *   // ...
 *   return <>{yourJsx}{dialog}</>;
 *
 * Render `dialog` once anywhere in the tree (it's `null` until a confirm is
 * in flight) — safe to call `confirm()` from inside a list/map, since the
 * dialog itself is a single shared instance keyed by whichever call is
 * currently pending.
 */
export function useConfirmDialog(): { confirm: (opts: ConfirmOptions) => Promise<boolean>; dialog: ReactNode } {
  const locale = useBuilderLocale();
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...opts, resolve });
    });
  }, []);

  function settle(result: boolean) {
    pending?.resolve(result);
    setPending(null);
  }

  const dialog = pending ? (
    <ConfirmDialog
      open
      title={pending.title ?? t(locale, "common.confirm.title")}
      message={pending.message}
      confirmLabel={t(locale, "common.confirm.ok")}
      cancelLabel={t(locale, "common.confirm.cancel")}
      destructive={pending.destructive}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  ) : null;

  return { confirm, dialog };
}
