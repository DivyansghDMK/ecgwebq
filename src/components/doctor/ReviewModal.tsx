import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, UploadCloud, Send, Pen, AlertCircle, RefreshCcw } from "lucide-react";
import { createReviewedPdf } from "@/utils/pdfProcessor";
import { uploadReviewedReport } from "@/api/ecgApi";
import { SignatureCanvas } from "./SignatureCanvas";

export interface DoctorReport {
  key: string;
  fileName: string;
  url: string;
  uploadedAt?: string; // ISO timestamp
  lastModified?: string; // Keep for backward compatibility
}

interface ReviewModalProps {
  open: boolean;
  report: DoctorReport | null;
  onClose: () => void;
  onSubmitted?: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  open,
  report,
  onClose,
  onSubmitted,
}) => {
  const [comments, setComments] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signatureMode, setSignatureMode] = useState<"upload" | "draw">("draw");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(true);

  const resetState = () => {
    setComments("");
    setDoctorId("");
    setSignatureFile(null);
    setSignatureDataUrl(null);
    setSignatureMode("draw");
    setSubmitting(false);
    setError(null);
    setSuccess(null);
    setPdfLoadError(null);
    setIsLoadingPdf(true);
  };

  // When the selected report changes, reset loading/error state.
  // We rely on the iframe's onLoad/onError events rather than doing a separate HEAD request,
  // because many S3/CORS configurations block HEAD from the browser which caused false failures.
  useEffect(() => {
    if (report?.url) {
      setIsLoadingPdf(true);
      setPdfLoadError(null);
    }
  }, [report?.url]);

  const handleClose = () => {
    if (submitting) return;
    resetState();
    onClose();
  };

  const handleSubmit = async () => {
    if (!report || !report.url) return;
    if (!doctorId.trim()) {
      setError("Please enter your Doctor ID before submitting.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const reviewedBlob = await createReviewedPdf(report.url, {
        comments,
        doctorId: doctorId.trim(),
        signatureFile: signatureMode === "upload" ? signatureFile : null,
        signatureDataUrl: signatureMode === "draw" ? signatureDataUrl : null,
      });

      const reviewedFileName = report.fileName.replace(/\.pdf$/i, "") + "_reviewed.pdf";
      const reviewedFile = new File([reviewedBlob], reviewedFileName, {
        type: "application/pdf",
      });

      const formData = new FormData();
      formData.append("reviewedPdf", reviewedFile);
      formData.append("originalFileName", report.fileName);
      formData.append("doctorId", doctorId.trim());

      await uploadReviewedReport(formData);

      setSuccess("Reviewed PDF uploaded successfully.");
      if (onSubmitted) onSubmitted();
    } catch (err: any) {
      console.error("Failed to upload reviewed report", err);
      setError(err?.message || "Failed to upload reviewed report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && report && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative flex w-full max-w-5xl flex-col gap-4 rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-orange-100 p-2">
                  <FileText className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Review Report
                  </h2>
                  <p className="text-xs text-slate-500">
                    {report.fileName}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Left: PDF preview */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-600">
                    PDF Preview
                  </p>
                  {pdfLoadError && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setPdfLoadError(null);
                        setIsLoadingPdf(true);
                        // Let the iframe reload naturally by toggling key/state;
                        // no extra network validation call is needed here.
                      }}
                      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-orange-600 hover:bg-orange-50"
                    >
                      <RefreshCcw size={12} />
                      Retry
                    </motion.button>
                  )}
                </div>
                <div className="relative h-[380px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  {!report.url ? (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      No preview URL available
                    </div>
                  ) : pdfLoadError ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
                      <AlertCircle className="h-8 w-8 text-red-400" />
                      <p className="text-xs font-medium text-red-600">{pdfLoadError}</p>
                      <p className="text-xs text-slate-500">You can still review and submit comments.</p>
                    </div>
                  ) : (
                    <>
                      {isLoadingPdf && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50/80">
                          <div className="text-xs text-slate-500">Loading PDF...</div>
                        </div>
                      )}
                      <iframe
                        src={report.url}
                        className="h-full w-full border-0"
                        title={report.fileName}
                        onLoad={() => setIsLoadingPdf(false)}
                        onError={() => {
                          setPdfLoadError("Failed to load PDF preview.");
                          setIsLoadingPdf(false);
                        }}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Right: form */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-semibold text-slate-700">
                  Doctor ID
                  <input
                    type="text"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    placeholder="Enter your doctor ID"
                    value={doctorId}
                    onChange={(e) => setDoctorId(e.target.value)}
                  />
                </label>

                <label className="text-xs font-semibold text-slate-700">
                  Comments / Findings
                  <textarea
                    className="mt-1 h-40 w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    placeholder="Write your interpretation or comments..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  />
                </label>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-700">
                      Signature (optional)
                    </p>
                    <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSignatureMode("draw");
                          setSignatureFile(null);
                        }}
                        className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                          signatureMode === "draw"
                            ? "bg-white text-orange-600 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Pen size={12} className="inline mr-1" />
                        Draw
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSignatureMode("upload");
                          setSignatureDataUrl(null);
                        }}
                        className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                          signatureMode === "upload"
                            ? "bg-white text-orange-600 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <UploadCloud size={12} className="inline mr-1" />
                        Upload
                      </button>
                    </div>
                  </div>
                  {signatureMode === "draw" ? (
                    <SignatureCanvas
                      onSignatureChange={setSignatureDataUrl}
                      width={280}
                      height={100}
                    />
                  ) : (
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-600 hover:border-orange-400 hover:bg-orange-50/40">
                      <UploadCloud size={16} className="text-orange-500" />
                      <span>
                        {signatureFile
                          ? signatureFile.name
                          : "Click to upload PNG/JPEG signature"}
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        className="hidden"
                        onChange={(e) =>
                          setSignatureFile(e.target.files?.[0] || null)
                        }
                      />
                    </label>
                  )}
                </div>

                {error && (
                  <p className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">
                    {error}
                  </p>
                )}
                {success && (
                  <p className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                    {success}
                  </p>
                )}

                <motion.button
                  whileHover={{ y: -1, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={submitting}
                  onClick={handleSubmit}
                  className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:from-orange-600 hover:to-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send size={16} />
                  {submitting ? "Uploading..." : "Submit Reviewed PDF"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};


