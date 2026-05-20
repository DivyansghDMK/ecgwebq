import { useState } from "react";
import type { FormEvent } from "react";
import { motion } from "framer-motion";
import { FileText, Loader2, ShieldCheck, X } from "lucide-react";
import type { LicenseTier } from "@/services/licenseService";

const tiers: LicenseTier[] = ["Trial", "Standard", "Professional", "Enterprise"];

interface GenerateLicenseModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onGenerate: (payload: { tier: LicenseTier; customerNotes: string }) => Promise<void>;
}

export default function GenerateLicenseModal({
  isOpen,
  isSubmitting,
  onClose,
  onGenerate,
}: GenerateLicenseModalProps) {
  const [tier, setTier] = useState<LicenseTier>("Trial");
  const [customerNotes, setCustomerNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onGenerate({ tier, customerNotes: customerNotes.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={isSubmitting ? undefined : onClose} />
      <motion.form
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 18 }}
        onSubmit={handleSubmit}
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-100 p-2 dark:bg-orange-900/50">
              <ShieldCheck className="h-5 w-5 text-orange-600 dark:text-orange-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Generate License</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">Create a new customer license key</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed dark:hover:bg-slate-700 dark:hover:text-white"
            aria-label="Close generate license modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-100">Tier</label>
            <select
              value={tier}
              onChange={(event) => setTier(event.target.value as LicenseTier)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50"
            >
              {tiers.map((tierOption) => (
                <option key={tierOption} value={tierOption}>
                  {tierOption}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-100">
              <FileText className="h-4 w-4 text-orange-600 dark:text-orange-300" />
              Customer Notes / Name
            </label>
            <textarea
              value={customerNotes}
              onChange={(event) => setCustomerNotes(event.target.value)}
              rows={4}
              placeholder="Customer name, order reference, or internal notes"
              className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50 dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end dark:border-slate-700 dark:bg-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:from-orange-600 hover:to-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Generate
          </button>
        </div>
      </motion.form>
    </div>
  );
}
