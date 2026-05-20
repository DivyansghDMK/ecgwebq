import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Clipboard,
  Copy,
  KeyRound,
  Laptop,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  ShieldOff,
  X,
} from "lucide-react";
import GenerateLicenseModal from "@/components/licenses/GenerateLicenseModal";
import RevokeLicenseModal from "@/components/licenses/RevokeLicenseModal";
import { useNotification } from "@/contexts/NotificationContext";
import {
  createLicense,
  fetchLicenseActivations,
  fetchLicenses,
  revokeLicense,
  type CreateLicensePayload,
  type LicenseActivation,
  type LicenseRecord,
} from "@/services/licenseService";

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusClasses(status: LicenseRecord["status"]): string {
  if (status === "active") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700";
  }

  return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700";
}

function getBestActivation(license: LicenseRecord, activations: LicenseActivation[]): LicenseActivation | null {
  return activations.find((activation) => activation.licenseKey === license.licenseKey) || null;
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
}

export default function LicensesPage() {
  const licensesPerPage = 10;
  const { showNotification } = useNotification();
  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [activations, setActivations] = useState<LicenseActivation[]>([]);
  const [selectedLicenseKey, setSelectedLicenseKey] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | LicenseRecord["status"]>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [licenseToRevoke, setLicenseToRevoke] = useState<LicenseRecord | null>(null);
  const [submittingGenerate, setSubmittingGenerate] = useState(false);
  const [submittingRevoke, setSubmittingRevoke] = useState(false);

  const selectedLicense = useMemo(
    () => licenses.find((license) => license.licenseKey === selectedLicenseKey) || licenses[0] || null,
    [licenses, selectedLicenseKey]
  );

  const selectedActivation = selectedLicense ? getBestActivation(selectedLicense, activations) : null;

  const filteredLicenses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return licenses.filter((license) => {
      const activation = getBestActivation(license, activations);
      const matchesStatus = statusFilter === "all" || license.status === statusFilter;
      const searchable = [
        license.licenseKey,
        license.backupKey,
        license.tier,
        license.status,
        license.machineName,
        license.machineHost,
        license.machineOs,
        license.machineId,
        license.customerNotes,
        activation?.machineName,
        activation?.machineHost,
        activation?.machineId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!query || searchable.includes(query));
    });
  }, [activations, licenses, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLicenses.length / licensesPerPage));
  const currentPageStart = (currentPage - 1) * licensesPerPage;
  const paginatedLicenses = filteredLicenses.slice(currentPageStart, currentPageStart + licensesPerPage);
  const activeCount = licenses.filter((license) => license.status === "active").length;
  const revokedCount = licenses.filter((license) => license.status === "revoked").length;
  const boundCount = licenses.filter((license) => license.machineName || license.machineHost || getBestActivation(license, activations)).length;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const loadLicenses = async () => {
    setLoading(true);
    setError(null);

    try {
      const [licenseRows, activationRows] = await Promise.all([fetchLicenses(), fetchLicenseActivations()]);
      setLicenses(licenseRows);
      setActivations(activationRows);
      setSelectedLicenseKey((current) => current || licenseRows[0]?.licenseKey || null);
      setCurrentPage(1);
    } catch (err: any) {
      const message = err?.message || "Failed to load licenses.";
      setError(message);
      showNotification(message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLicenses();
  }, []);

  const handleGenerateLicense = async (payload: CreateLicensePayload) => {
    setSubmittingGenerate(true);
    try {
      const createdLicense = await createLicense(payload);
      setLicenses((current) => [createdLicense, ...current.filter((license) => license.licenseKey !== createdLicense.licenseKey)]);
      setSelectedLicenseKey(createdLicense.licenseKey);
      showNotification("License generated successfully", "success");
      setShowGenerateModal(false);
    } catch (err: any) {
      showNotification(err?.message || "Failed to generate license", "error");
    } finally {
      setSubmittingGenerate(false);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!licenseToRevoke) return;

    setSubmittingRevoke(true);
    try {
      await revokeLicense(licenseToRevoke.licenseKey);
      setLicenses((current) =>
        current.map((license) =>
          license.licenseKey === licenseToRevoke.licenseKey
            ? { ...license, status: "revoked", revokedAt: new Date().toISOString() }
            : license
        )
      );
      showNotification("License revoked successfully", "success");
      setLicenseToRevoke(null);
    } catch (err: any) {
      showNotification(err?.message || "Failed to revoke license", "error");
    } finally {
      setSubmittingRevoke(false);
    }
  };

  const handleCopyLicense = async (licenseKey: string) => {
    try {
      await copyText(licenseKey);
      showNotification("License key copied", "success", 2500);
    } catch {
      showNotification("Unable to copy license key", "error");
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Licenses</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Generate, revoke, and inspect CardioX license activations.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={loadLicenses}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowGenerateModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:from-orange-600 hover:to-amber-600"
          >
            <Plus className="h-4 w-4" />
            Generate License
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          { label: "Total Licenses", value: licenses.length, icon: KeyRound, color: "from-blue-500 to-indigo-600" },
          { label: "Active", value: activeCount, icon: ShieldCheck, color: "from-emerald-500 to-teal-600" },
          { label: "Revoked", value: revokedCount, icon: ShieldOff, color: "from-red-500 to-rose-600" },
          { label: "Machine Bound", value: boundCount, icon: Laptop, color: "from-orange-500 to-amber-500" },
        ].map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className={`rounded-2xl bg-gradient-to-br ${item.color} p-5 text-white shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-white/20 p-2">
                <item.icon className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold uppercase">Live</span>
            </div>
            <p className="mt-4 text-sm font-medium text-white/85">{item.label}</p>
            <p className="mt-1 text-3xl font-bold">{item.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-500" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by license key, tier, customer, machine, or host"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-10 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all", "active", "revoked"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize transition ${
                  statusFilter === status
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-100">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <motion.div
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-4 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/20 p-2">
                <Clipboard className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">License Registry</h2>
                <p className="text-xs text-white/80">
                  {filteredLicenses.length} visible licenses
                  {filteredLicenses.length > 0 ? ` - page ${currentPage} of ${totalPages}` : ""}
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
              <p className="mt-4 font-semibold text-slate-700 dark:text-slate-200">Loading licenses...</p>
            </div>
          ) : filteredLicenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <div className="rounded-full bg-slate-100 p-5 dark:bg-slate-800">
                <KeyRound className="h-10 w-10 text-slate-400" />
              </div>
              <p className="mt-4 text-lg font-bold text-slate-800 dark:text-slate-100">
                {licenses.length === 0 ? "No licenses yet" : "No matching licenses"}
              </p>
              <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
                {licenses.length === 0
                  ? "Generated licenses will appear here after the backend returns them."
                  : "Try a different search term or status filter."}
              </p>
              {licenses.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(true)}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-orange-600"
                >
                  <Plus className="h-4 w-4" />
                  Generate License
                </button>
              ) : null}
            </div>
          ) : (
            <>
            <div className="max-h-[620px] overflow-auto">
              <table className="min-w-[1120px] w-full border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold">License Key</th>
                    <th className="px-4 py-3 text-left font-bold">Backup Key</th>
                    <th className="px-4 py-3 text-left font-bold">Tier</th>
                    <th className="px-4 py-3 text-left font-bold">Status</th>
                    <th className="px-4 py-3 text-left font-bold">Machine Name</th>
                    <th className="px-4 py-3 text-left font-bold">Machine Host</th>
                    <th className="px-4 py-3 text-left font-bold">Created At</th>
                    <th className="px-4 py-3 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {paginatedLicenses.map((license) => {
                    const activation = getBestActivation(license, activations);
                    const machineName = license.machineName || activation?.machineName || "-";
                    const machineHost = license.machineHost || activation?.machineHost || "-";

                    return (
                      <tr
                        key={license.licenseKey}
                        onClick={() => setSelectedLicenseKey(license.licenseKey)}
                        className={`cursor-pointer transition hover:bg-orange-50/60 dark:hover:bg-slate-800 ${
                          selectedLicense?.licenseKey === license.licenseKey ? "bg-orange-50 dark:bg-slate-800" : ""
                        }`}
                      >
                        <td className="px-4 py-4 align-top">
                          <div className="flex items-center gap-2">
                            <span className="max-w-[240px] break-all rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs leading-5 text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                              {license.licenseKey || "-"}
                            </span>
                            {license.licenseKey ? (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleCopyLicense(license.licenseKey);
                                }}
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-orange-600 dark:hover:bg-slate-700"
                                aria-label="Copy license key"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex items-center gap-2">
                            <span className="max-w-[240px] break-all rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs leading-5 text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                              {license.backupKey || "-"}
                            </span>
                            {license.backupKey ? (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleCopyLicense(license.backupKey || "");
                                }}
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-orange-600 dark:hover:bg-slate-700"
                                aria-label="Copy backup key"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top text-sm font-semibold text-slate-700 dark:text-slate-200">{license.tier}</td>
                        <td className="px-4 py-4 align-top">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${statusClasses(license.status)}`}>
                            {license.status === "active" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                            {license.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top text-sm text-slate-700 dark:text-slate-200">{machineName}</td>
                        <td className="px-4 py-4 align-top text-sm text-slate-700 dark:text-slate-200">{machineHost}</td>
                        <td className="px-4 py-4 align-top text-sm text-slate-600 dark:text-slate-300">{formatDate(license.createdAt)}</td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleCopyLicense(license.licenseKey);
                              }}
                              disabled={!license.licenseKey}
                              className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                              aria-label="Copy license"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setLicenseToRevoke(license);
                              }}
                              disabled={license.status === "revoked"}
                              className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200"
                              aria-label="Revoke license"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800/70">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Showing {currentPageStart + 1} to {Math.min(currentPageStart + paginatedLicenses.length, filteredLicenses.length)} of {filteredLicenses.length} licenses
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  Previous
                </button>
                <span className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-100">
                  Page {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  Next
                </button>
              </div>
            </div>
            </>
          )}
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Activation Details</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Machine binding and recent activation data</p>
          </div>

          {!selectedLicense ? (
            <div className="p-8 text-center">
              <Laptop className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Select a license to view activation details.</p>
            </div>
          ) : (
            <div className="space-y-4 p-5">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">License Key</p>
                <p className="mt-2 break-all font-mono text-xs text-slate-800 dark:text-slate-100">{selectedLicense.licenseKey}</p>
              </div>

              {[
                ["Tier", selectedLicense.tier],
                ["Status", selectedLicense.status],
                ["Machine Name", selectedLicense.machineName || selectedActivation?.machineName || "-"],
                ["Machine Host", selectedLicense.machineHost || selectedActivation?.machineHost || "-"],
                ["Machine OS", selectedLicense.machineOs || "-"],
                ["Machine ID", selectedLicense.machineId || selectedActivation?.machineId || "-"],
                ["Activated At", formatDate(selectedLicense.activatedAt || selectedActivation?.activatedAt)],
                ["Last Seen", formatDate(selectedLicense.lastSeenAt || selectedActivation?.lastSeenAt)],
                ["Customer Notes", selectedLicense.customerNotes || "-"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
                  <p className="mt-1 break-words text-sm font-semibold capitalize text-slate-800 dark:text-slate-100">{value}</p>
                </div>
              ))}
            </div>
          )}
        </motion.aside>
      </div>

      <GenerateLicenseModal
        isOpen={showGenerateModal}
        isSubmitting={submittingGenerate}
        onClose={() => setShowGenerateModal(false)}
        onGenerate={handleGenerateLicense}
      />
      <RevokeLicenseModal
        license={licenseToRevoke}
        isSubmitting={submittingRevoke}
        onClose={() => setLicenseToRevoke(null)}
        onConfirm={handleConfirmRevoke}
      />
    </div>
  );
}
