import { useState } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { VersionHero } from '@/components/VersionHero';
import { VersionCard } from '@/components/VersionCard';
import { useVersionVerification } from '@/hooks/useVersionVerification';

export default function VersionDownloadPage() {
  const [empCode, setEmpCode] = useState('');
  const { verification, verifyCode, handleDownload, resetVerification } = useVersionVerification();

  const handleVerifyCode = () => {
    if (empCode.trim()) {
      verifyCode(empCode.trim());
    }
  };

  const handleEmpCodeChange = (value: string) => {
    setEmpCode(value);
    if (verification.isVerified) {
      resetVerification();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerifyCode();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navbar />
      
      <main className="pt-32 pb-20">
        <VersionHero />
        
        <div className="container mx-auto px-4 mt-16">
          <VersionCard
            empCode={empCode}
            employeeName={verification.employeeName}
            isVerified={verification.isVerified}
            isLoading={verification.isLoading}
            error={verification.error}
            onEmpCodeChange={handleEmpCodeChange}
            onVerifyCode={handleVerifyCode}
            onDownload={handleDownload}
            onKeyPress={handleKeyPress}
          />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
