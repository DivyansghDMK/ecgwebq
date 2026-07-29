import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Clipboard,
  Copy,
  Download,
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
  deleteSeat,
  fetchLicenseActivations,
  fetchLicenses,
  exportLicensesToCSV,
  revokeLicense,
  unrevokeLicense,
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

  if (status === "unused") {
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700";
  }

  return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700";
}

function getBestActivation(license: LicenseRecord, activations: LicenseActivation[]): LicenseActivation | null {
  return activations.find((activation) => activation.licenseKey === license.licenseKey) || null;
}

function getRawString(source: Record<string, unknown> | undefined, keys: string[]): string | null {
  if (!source) return null;

  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return null;
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
        license.seatNumber,
        license.seatId,
        license.seatStatus,
        license.fullName,
        license.doctorName,
        license.orgName,
        license.orgAddress,
        license.phone,
        license.pcName,
        license.windowsVersion,
        license.machineSerialId,
        license.rhythmultaSerial,
        license.boundFingerprint,
        license.lastHeartbeat,
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
  const unusedCount = licenses.filter((license) => license.status === "unused").length;
  const revokedCount = licenses.filter((license) => license.status === "revoked").length;
  const selectedSeatState = selectedLicense?.status || "unused";
  const detailGroups = selectedLicense
    ? [
        {
          title: "Identity",
          accent: "from-orange-500 to-amber-500",
          items: [
            ["Seat Number", selectedLicense.seatNumber || getRawString(selectedActivation?.raw, ["seat_number", "seatNumber"]) || "-"],
            ["Seat ID", selectedLicense.seatId || getRawString(selectedActivation?.raw, ["seat_id", "seatId"]) || "-"],
            ["Seat Status", selectedLicense.seatStatus || getRawString(selectedActivation?.raw, ["seat_status", "seatStatus"]) || "-"],
            ["Full Name", selectedLicense.fullName || getRawString(selectedActivation?.raw, ["full_name", "fullName"]) || "-"],
            ["Doctor Name", selectedLicense.doctorName || getRawString(selectedActivation?.raw, ["doctor_name", "doctorName"]) || "-"],
            ["Organization", selectedLicense.orgName || getRawString(selectedActivation?.raw, ["org_name", "orgName"]) || "-"],
            ["Organization Address", selectedLicense.orgAddress || getRawString(selectedActivation?.raw, ["org_address", "orgAddress"]) || "-"],
            ["Phone", selectedLicense.phone || getRawString(selectedActivation?.raw, ["phone"]) || "-"],
          ],
        },
        {
          title: "Device",
          accent: "from-sky-500 to-cyan-500",
          items: [
            ["PC Name", selectedLicense.pcName || getRawString(selectedActivation?.raw, ["pc_name", "pcName"]) || selectedLicense.machineName || selectedActivation?.machineName || "-"],
            ["Windows Version", selectedLicense.windowsVersion || getRawString(selectedActivation?.raw, ["windows_version", "windowsVersion"]) || selectedLicense.machineOs || "-"],
            ["Machine Serial ID", selectedLicense.machineSerialId || getRawString(selectedActivation?.raw, ["machine_serial_id", "machineSerialId"]) || selectedLicense.machineId || selectedActivation?.machineId || "-"],
            ["Rhythmulta Serial", selectedLicense.rhythmultaSerial || getRawString(selectedActivation?.raw, ["rhythmulta_serial", "rhythmultaSerial"]) || "-"],
            ["Bound Fingerprint", selectedLicense.boundFingerprint || getRawString(selectedActivation?.raw, ["bound_fingerprint", "boundFingerprint"]) || selectedLicense.machineId || selectedActivation?.machineId || "-"],
            ["Machine Host", selectedLicense.machineHost || selectedActivation?.machineHost || "-"],
          ],
        },
        {
          title: "Timeline",
          accent: "from-emerald-500 to-teal-500",
          items: [
            ["Tier", selectedLicense.tier],
            ["Status", selectedLicense.status],
            ["Activated At", formatDate(selectedLicense.activatedAt || selectedActivation?.activatedAt)],
            ["Last Heartbeat", formatDate(selectedLicense.lastHeartbeat || selectedLicense.lastSeenAt || selectedActivation?.lastSeenAt)],
            ["Created At", formatDate(selectedLicense.createdAt)],
            ["Machine ID", selectedLicense.machineId || selectedActivation?.machineId || "-"],
          ],
        },
    ]
    : [];

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

  const handleUnrevoke = async (licenseKey: string) => {
    try {
      await unrevokeLicense(licenseKey);
      setLicenses((current) =>
        current.map((license) => (license.licenseKey === licenseKey ? { ...license, status: "active", revokedAt: null } : license))
      );
      showNotification("License activated successfully", "success");
    } catch (err: any) {
      showNotification(err?.message || "Failed to activate", "error");
    }
  };

  const handleDeleteSeat = async (licenseKey: string) => {
    if (!window.confirm("Delete seat binding? Key will become unused.")) return;

    try {
      await deleteSeat(licenseKey);
      setLicenses((current) =>
        current.map((license) =>
          license.licenseKey === licenseKey
            ? {
                ...license,
                status: "unused",
                machineName: null,
                machineHost: null,
                machineOs: null,
                machineId: null,
                machineSerialId: null,
                rhythmultaSerial: null,
                boundFingerprint: null,
                activatedAt: null,
                lastSeenAt: null,
                lastHeartbeat: null,
                revokedAt: null,
              }
            : license
        )
      );
      showNotification("Seat deleted - key is now unused", "success");
    } catch (err: any) {
      showNotification(err?.message || "Failed to delete seat", "error");
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
    <div className="relative overflow-hidden space-y-6 pb-6">
      <div className="pointer-events-none absolute -top-10 right-6 h-40 w-40 rounded-full bg-orange-300/20 blur-3xl" />
      <div className="pointer-events-none absolute left-0 top-40 h-56 w-56 rounded-full bg-sky-300/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" />
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur lg:flex-row lg:items-center lg:justify-between dark:border-slate-700 dark:bg-slate-900/80"
      >
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-orange-700 dark:border-orange-900/60 dark:bg-orange-900/20 dark:text-orange-200">
            Seat Registry
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">Licenses</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Generate, revoke, and inspect CardioX seat activations, machine bindings, and customer identity details.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => exportLicensesToCSV(filteredLicenses)}
            disabled={filteredLicenses.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
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
          { label: "Total Licenses", value: licenses.length, icon: KeyRound, color: "from-indigo-500 via-blue-500 to-sky-500", helper: "All seats in the registry" },
          { label: "Active", value: activeCount, icon: ShieldCheck, color: "from-emerald-500 via-teal-500 to-cyan-500", helper: "Currently usable seats" },
          { label: "Unused", value: unusedCount, icon: Laptop, color: "from-amber-500 via-orange-500 to-yellow-500", helper: "Created but not activated" },
          { label: "Revoked", value: revokedCount, icon: ShieldOff, color: "from-rose-500 via-red-500 to-orange-500", helper: "Disabled and blocked" },
        ].map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className={`relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br ${item.color} p-5 text-white shadow-[0_18px_50px_-24px_rgba(15,23,42,0.65)]`}
          >
            <div className="absolute inset-0 bg-white/10 [mask-image:radial-gradient(circle_at_top_right,black,transparent_60%)]" />
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-white/20 p-2">
                <item.icon className="h-5 w-5" />
              </div>
              <span className="rounded-full border border-white/25 bg-white/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em]">Live</span>
            </div>
            <p className="relative mt-4 text-sm font-medium text-white/85">{item.label}</p>
            <p className="relative mt-1 text-3xl font-black tracking-tight">{item.value}</p>
            <p className="relative mt-2 text-xs font-medium text-white/75">{item.helper}</p>
          </motion.div>
        ))}
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-white/95 p-5 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.45)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
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
            {(["all", "active", "unused", "revoked"] as const).map((status) => (
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <motion.div
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
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
            <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-1">
              {paginatedLicenses.map((license, index) => {
                const activation = getBestActivation(license, activations);
                const machineName = license.machineName || activation?.machineName || "-";
                const machineHost = license.machineHost || activation?.machineHost || "-";
                const keyLabel = license.licenseKey || "-";

                return (
                  <motion.div
                    key={license.licenseKey}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => setSelectedLicenseKey(license.licenseKey)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedLicenseKey(license.licenseKey);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={`group cursor-pointer rounded-[1.4rem] border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60 ${
                      selectedLicense?.licenseKey === license.licenseKey
                        ? "border-orange-300 bg-orange-50/60 shadow-[0_16px_32px_-20px_rgba(249,115,22,0.45)] dark:border-orange-700 dark:bg-orange-900/20"
                        : "border-slate-200 bg-white hover:border-orange-200 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-orange-700/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex max-w-full items-center rounded-full bg-slate-100 px-3 py-1 font-mono text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                            {keyLabel}
                          </span>
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize ${statusClasses(license.status)}`}>
                            {license.status === "active" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                            {license.status}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
                          {license.fullName || license.doctorName || license.orgName || "Untitled seat"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {license.orgName || "-"} {license.pcName ? `· ${license.pcName}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {license.licenseKey ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleCopyLicense(license.licenseKey);
                            }}
                            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-orange-300 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            aria-label="Copy license"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setLicenseToRevoke(license);
                          }}
                          disabled={license.status === "revoked"}
                          className="rounded-xl border border-red-200 bg-red-50 p-2 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200"
                          aria-label="Revoke license"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleUnrevoke(license.licenseKey);
                          }}
                          disabled={license.status !== "revoked"}
                          className="rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-emerald-600 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-900/50"
                          aria-label="Unrevoke license"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteSeat(license.licenseKey);
                          }}
                          disabled={license.status === "unused"}
                          className="rounded-xl border border-orange-200 bg-orange-50 p-2 text-orange-600 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-orange-700 dark:bg-orange-900/30 dark:text-orange-200 dark:hover:bg-orange-900/50"
                          aria-label="Clear seat"
                          title="Clear machine binding"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {[
                        ["Machine Name", machineName],
                        ["Machine Host", machineHost],
                        ["Machine Serial", license.machineSerialId || license.machineId || "-"],
                        ["RhythmUlta", license.rhythmultaSerial || "-"],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/70">
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
                          <p className="mt-1 break-words text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
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
          className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white/95 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.45)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/90"
        >
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-5 py-5 dark:border-slate-700 dark:from-slate-900 dark:to-slate-800">
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-50">Activation Details</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Machine binding and recent activation data</p>
          </div>

          {!selectedLicense ? (
            <div className="p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                <Laptop className="h-7 w-7 text-slate-400" />
              </div>
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Select a license to view activation details.</p>
            </div>
          ) : (
            <div className="space-y-4 px-5 py-5">
              <div className="rounded-[1.4rem] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-orange-50 p-4 shadow-sm dark:border-slate-700 dark:from-slate-800 dark:via-slate-900 dark:to-slate-900/80">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">License Key</p>
                    <p className="mt-2 break-words font-mono text-sm font-semibold text-slate-900 dark:text-slate-50">
                      {selectedLicense.licenseKey}
                    </p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${
                      selectedSeatState === "active"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-200"
                        : selectedSeatState === "unused"
                          ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-200"
                          : "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-200"
                    }`}
                  >
                    {selectedSeatState}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white dark:bg-slate-100 dark:text-slate-900">
                    {selectedLicense.tier}
                  </span>
                  {selectedLicense.pcName ? (
                    <span className="max-w-full rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {selectedLicense.pcName}
                    </span>
                  ) : null}
                  {selectedLicense.orgName ? (
                    <span className="max-w-full rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {selectedLicense.orgName}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4">
                {detailGroups.map((section) => (
                  <div key={section.title} className="overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className={`h-1 bg-gradient-to-r ${section.accent}`} />
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">{section.title}</h3>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                          {section.items.length} fields
                        </span>
                      </div>
                      <div className="mt-4 grid gap-3">
                        {section.items.map(([label, value]) => (
                          <div key={label} className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{label}</p>
                            <p className="mt-1 break-words text-sm font-semibold leading-5 text-slate-900 dark:text-slate-100">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
