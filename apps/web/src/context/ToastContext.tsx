import { createContext, useContext, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, AlertTriangle, Info, X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastKind = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  message: string;
  kind: ToastKind;
  undoFn?: () => void;
}

interface ToastContextType {
  showToast: (message: string, kind?: ToastKind, undoFn?: () => void) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() { return useContext(ToastContext); }

const ICONS: Record<ToastKind, React.ReactNode> = {
  success: <Check className="w-4 h-4" />,
  error:   <X className="w-4 h-4" />,
  warning: <AlertTriangle className="w-4 h-4" />,
  info:    <Info className="w-4 h-4" />,
};

const COLORS: Record<ToastKind, string> = {
  success: "bg-teal-500/90 text-white",
  error:   "bg-red-500/90 text-white",
  warning: "bg-amber-500/90 text-white",
  info:    "bg-purple-600/90 text-white",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const remove = useCallback((id: string) => {
    clearTimeout(timers.current[id]);
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, kind: ToastKind = "success", undoFn?: () => void) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev.slice(-3), { id, message, kind, undoFn }]);
    timers.current[id] = setTimeout(() => remove(id), undoFn ? 5000 : 4000);
  }, [remove]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="sync">
          {toasts.map(t => (
            <motion.div key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={cn("pointer-events-auto flex items-center gap-3 pl-3 pr-2 py-2.5 rounded-2xl shadow-2xl text-sm font-medium min-w-[220px] max-w-xs", COLORS[t.kind])}>
              <span className="shrink-0">{ICONS[t.kind]}</span>
              <span className="flex-1">{t.message}</span>
              {t.undoFn && (
                <button onClick={() => { t.undoFn!(); remove(t.id); }}
                  className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors shrink-0">
                  <RotateCcw className="w-3 h-3" /> Undo
                </button>
              )}
              <button onClick={() => remove(t.id)} className="text-white/60 hover:text-white shrink-0 p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
