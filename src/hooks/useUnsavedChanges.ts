import { useCallback, useRef, useState } from "react";
import { useConfirm } from "@/components/ConfirmDialog";

/**
 * Tracks "dirty" state for forms and asks confirmation before discarding.
 * Usage:
 *   const { markDirty, reset, guardClose } = useUnsavedChanges();
 *   // on every field change: markDirty()
 *   // on dialog onOpenChange: guardClose(open, () => doClose())
 *   // after successful save: reset()
 */
export function useUnsavedChanges() {
  const dirtyRef = useRef(false);
  const [, force] = useState(0);
  const confirm = useConfirm();

  const markDirty = useCallback(() => {
    if (!dirtyRef.current) {
      dirtyRef.current = true;
      force((n) => n + 1);
    }
  }, []);

  const reset = useCallback(() => {
    dirtyRef.current = false;
    force((n) => n + 1);
  }, []);

  const isDirty = () => dirtyRef.current;

  /** Call from Dialog onOpenChange. Returns a Promise<boolean> indicating if close should proceed. */
  const confirmDiscard = useCallback(async () => {
    if (!dirtyRef.current) return true;
    const ok = await confirm({
      title: "Descartar alterações?",
      description: "Você tem alterações não salvas. Deseja realmente sair sem salvar?",
      confirmText: "Descartar",
      cancelText: "Continuar editando",
      variant: "destructive",
    });
    if (ok) reset();
    return ok;
  }, [confirm, reset]);

  return { markDirty, reset, isDirty, confirmDiscard };
}
