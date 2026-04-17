import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

type ConfirmFn = (opts?: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<{
    open: boolean;
    options: ConfirmOptions;
    resolve?: (v: boolean) => void;
  }>({ open: false, options: {} });

  const confirm: ConfirmFn = useCallback((options = {}) => {
    return new Promise<boolean>((resolve) => {
      setState({ open: true, options, resolve });
    });
  }, []);

  const handleClose = (result: boolean) => {
    state.resolve?.(result);
    setState({ open: false, options: {} });
  };

  const {
    title = "Confirmar exclusão",
    description = "Esta ação não pode ser desfeita.",
    confirmText = "Excluir",
    cancelText = "Cancelar",
    variant = "destructive",
  } = state.options;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog open={state.open} onOpenChange={(v) => !v && handleClose(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleClose(false)}>{cancelText}</AlertDialogCancel>
            <AlertDialogAction
              className={cn(variant === "destructive" && buttonVariants({ variant: "destructive" }))}
              onClick={() => handleClose(true)}
            >
              {confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = (): ConfirmFn => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
};
