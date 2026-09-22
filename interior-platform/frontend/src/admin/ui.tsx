import { ReactNode, createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

/* ---------------- Modal ---------------- */
export function Modal({
  open, onClose, title, children, width = "max-w-lg",
}: { open: boolean; onClose: () => void; title: string; children: ReactNode; width?: string }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-charcoal-950/50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={`bg-white w-full ${width} max-h-[85vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-charcoal-900/10 sticky top-0 bg-white">
              <h2 className="font-display text-lg">{title}</h2>
              <button onClick={onClose} aria-label="Close"><X size={18} /></button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------- Confirm dialog ---------------- */
export function ConfirmDialog({
  open, onCancel, onConfirm, title, body,
}: { open: boolean; onCancel: () => void; onConfirm: () => void; title: string; body: string }) {
  return (
    <Modal open={open} onClose={onCancel} title={title} width="max-w-sm">
      <p className="text-sm text-charcoal-700 mb-8">{body}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="btn-secondary !py-2 !px-4 text-xs">Cancel</button>
        <button onClick={onConfirm} className="!py-2 !px-4 text-xs bg-red-600 text-white hover:bg-red-700 transition-colors">
          Confirm
        </button>
      </div>
    </Modal>
  );
}

/* ---------------- Toast ---------------- */
interface Toast { id: number; message: string; type: "success" | "error" }
const ToastContext = createContext<(message: string, type?: "success" | "error") => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] space-y-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className={`px-5 py-3 text-sm shadow-lg ${
                t.type === "success" ? "bg-charcoal-900 text-sand-50" : "bg-red-600 text-white"
              }`}
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

/* ---------------- Data table ---------------- */
export function DataTable<T>({
  columns, rows, empty = "No records found.", loading = false,
}: {
  columns: { key: string; label: string; render?: (row: T) => ReactNode }[];
  rows: T[];
  empty?: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-sand-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return <div className="py-16 text-center text-sm text-charcoal-700/60 bg-sand-100/40">{empty}</div>;
  }

  return (
    <div className="overflow-x-auto bg-white border border-charcoal-900/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-charcoal-900/10 bg-sand-100/50">
            {columns.map((c) => (
              <th key={c.key} className="text-left px-4 py-3 text-[11px] uppercase tracking-widest2 text-charcoal-700/60 font-medium whitespace-nowrap">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <motion.tr
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              className="border-b border-charcoal-900/5 hover:bg-sand-50 transition-colors"
            >
              {columns.map((c) => (
                <td key={c.key} className="px-4 py-3 align-middle">
                  {c.render ? c.render(row) : String((row as any)[c.key] ?? "—")}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const adminInput =
  "w-full border border-charcoal-900/15 px-3 py-2 text-sm outline-none focus:border-clay-500 transition-colors";
