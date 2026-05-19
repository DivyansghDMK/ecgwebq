import { motion } from "framer-motion";
import { AlertTriangle, Loader2, X } from "lucide-react";
import type { LicenseRecord } from "@/services/licenseService";

interface RevokeLicenseModalProps {
  license: LicenseRecord | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function RevokeLicenseModal({
  license,
  isSubmitting,
  onClose,
  onConfirm,
}: RevokeLicenseModalProps) {
  if (!license) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={isSubmitting ? undefined : onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 18 }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed dark:hover:bg-slate-700 dark:hover:text-white"
          aria-label="Close revoke confirmation"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-7">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
            <AlertTriangle className="h-7 w-7 text-red-600 dark:text-red-300" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Revoke License?</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            This will disable the license key immediately. The customer will no longer be able to use this activation.
          </p>
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {license.licenseKey}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-7 py-4 sm:flex-row sm:justify-end dark:border-slate-700 dark:bg-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition hover:from-red-600 hover:to-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
            Revoke
          </button>
        </div>
      </motion.div>
    </div>
  );
}
