import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Download, Loader2, User } from 'lucide-react';

interface VersionCardProps {
  empCode: string;
  employeeName: string;
  isVerified: boolean;
  isLoading: boolean;
  error: string | null;
  onEmpCodeChange: (value: string) => void;
  onVerifyCode: () => void;
  onDownload: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

export function VersionCard({
  empCode,
  employeeName,
  isVerified,
  isLoading,
  error,
  onEmpCodeChange,
  onVerifyCode,
  onDownload,
  onKeyPress,
}: VersionCardProps) {
  const [isSuccess, setIsSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Validate employee code format
  const validateEmployeeCode = (code: string): string | null => {
    if (!code) return null;
    
    // Check length: 5-8 characters
    if (code.length < 5 || code.length > 8) {
      return 'Employee code must be 5-8 characters';
    }
    
    // Check format: first 2 letters, then numbers
    const formatRegex = /^[A-Za-z]{2}[0-9]+$/;
    if (!formatRegex.test(code)) {
      return 'Enter a valid employee access code';
    }
    
    return null;
  };

  // Handle input change with validation
  const handleInputChange = (value: string) => {
    const upperValue = value.toUpperCase();
    onEmpCodeChange(upperValue);
    
    // Clear validation error when user corrects input
    if (validationError && !validateEmployeeCode(upperValue)) {
      setValidationError(null);
    }
  };

  // Enhanced verify function with validation
  const handleVerifyCode = () => {
    const validationError = validateEmployeeCode(empCode);
    if (validationError) {
      setValidationError(validationError);
      return;
    }
    
    setValidationError(null);
    onVerifyCode();
  };

  // Enhanced key press handler
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerifyCode();
    }
  };

  // Show success animation when verified
  useEffect(() => {
    if (isVerified && !isSuccess) {
      setIsSuccess(true);
      const timer = setTimeout(() => setIsSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isVerified, isSuccess]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6 }}
      className="max-w-md mx-auto"
    >
      {/* Enhanced Glassmorphism Card */}
      <div className="relative backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        {/* Enhanced glowing border effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/30 via-purple-500/20 to-orange-500/30 rounded-3xl blur-md" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl" />
        
        <div className="relative p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 mb-2 shadow-lg shadow-orange-500/25">
              <Download className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">Download Center</h2>
              <p className="text-gray-400 text-sm font-medium">Verify your employee access to download</p>
            </div>
          </div>

          {/* Success Animation */}
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center justify-center p-4 bg-green-500/10 border border-green-500/30 rounded-xl"
            >
              <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
              <span className="text-green-300 text-sm font-medium">Employee verified successfully!</span>
            </motion.div>
          )}

          {/* Validation Error Message */}
          {validationError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex items-center p-4 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur-sm"
            >
              <AlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0" />
              <span className="text-red-300 text-sm font-medium">{validationError}</span>
            </motion.div>
          )}

          {/* API Error Message */}
          {error && !validationError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex items-center p-4 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur-sm"
            >
              <AlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0" />
              <span className="text-red-300 text-sm font-medium">{error}</span>
            </motion.div>
          )}

          {/* Employee Code Input */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <User className="w-4 h-4 text-orange-400" />
              Employee Access Code
            </label>
            <div className="relative">
              <input
                type="text"
                value={empCode}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your employee code"
                maxLength={8}
                className={`w-full px-4 py-4 bg-white/5 border rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 disabled:opacity-50 ${
                  validationError ? 'border-red-500/50 focus:ring-red-500/50' : 'border-white/10'
                }`}
                disabled={isLoading}
              />
              {/* Character count indicator */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                {empCode.length}/8
              </div>
            </div>
            <p className="text-xs text-gray-500 opacity-70">Format: 2 letters followed by numbers (e.g., DM485)</p>
          </div>

          {/* Employee Name (Auto-filled) */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-200">Employee Name</label>
            <div className="relative">
              <input
                type="text"
                value={employeeName}
                readOnly
                placeholder="Will be auto-filled after verification"
                className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-gray-400 placeholder-gray-600 cursor-not-allowed backdrop-blur-sm transition-all duration-300"
                disabled={!isVerified}
              />
              {isVerified && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </motion.div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            {/* Verify Code Button */}
            {!isVerified && (
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(251, 146, 60, 0.5)" }}
                whileTap={{ scale: 0.98 }}
                onClick={handleVerifyCode}
                disabled={!empCode.trim() || isLoading || validationError !== null}
                className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-2xl hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-sm shadow-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </motion.button>
            )}

            {/* Download Button */}
            {isVerified && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(34, 197, 94, 0.5)" }}
                whileTap={{ scale: 0.98 }}
                onClick={onDownload}
                className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-2xl hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-sm shadow-lg"
              >
                <>
                  <Download className="w-5 h-5" />
                  Download Latest Version
                </>
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Security Note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="text-center text-xs text-gray-500 mt-8 px-4 font-medium opacity-80"
      >
        Software downloads are restricted to authorized CardioX employees only.
      </motion.p>
    </motion.div>
  );
}
