import { useState } from 'react';
import { validateCompanyCode, getDownloadLink, CompanyDetailsResponse } from '@/services/versionApi';

export interface VerificationState {
  isLoading: boolean;
  isVerified: boolean;
  employeeName: string;
  error: string | null;
}

export function useVersionVerification() {
  const [verification, setVerification] = useState<VerificationState>({
    isLoading: false,
    isVerified: false,
    employeeName: '',
    error: null,
  });

  const verifyCode = async (empCode: string) => {
    setVerification(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const response: CompanyDetailsResponse = await validateCompanyCode(empCode);
      
      if (response.success && response.employee_name) {
        // Clear any previous errors on successful verification
        setVerification({
          isLoading: false,
          isVerified: true,
          employeeName: response.employee_name,
          error: null,
        });
      } else {
        // Show clean user-friendly error message
        setVerification({
          isLoading: false,
          isVerified: false,
          employeeName: '',
          error: response.message || 'Unable to verify access code right now',
        });
      }
    } catch (error) {
      // This should not be reached with the new error handling, but added as fallback
      setVerification({
        isLoading: false,
        isVerified: false,
        employeeName: '',
        error: 'Something went wrong. Please try again',
      });
    }
  };

  const handleDownload = () => {
    // Redirect to GitHub releases page
    window.location.href = getDownloadLink();
  };

  const resetVerification = () => {
    setVerification({
      isLoading: false,
      isVerified: false,
      employeeName: '',
      error: null,
    });
  };

  return {
    verification,
    verifyCode,
    handleDownload,
    resetVerification,
  };
}
