import { useState } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { VersionHero } from '@/components/VersionHero';
import { VersionCard } from '@/components/VersionCard';
import { ReleaseChannelCard } from '@/components/releases/ReleaseChannelCard';
import { useVersionVerification } from '@/hooks/useVersionVerification';
import { useLatestRelease } from '@/hooks/useLatestRelease';

export default function VersionDownloadPage() {
  const [empCode, setEmpCode] = useState('');
  const { verification, verifyCode, resetVerification } = useVersionVerification();
  const stable = useLatestRelease('stable');
  const beta = useLatestRelease('beta');

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
        <VersionHero stable={stable.state} beta={beta.state} />

        <div className="container mx-auto px-4 mt-16">
          <VersionCard
            empCode={empCode}
            employeeName={verification.employeeName}
            isVerified={verification.isVerified}
            isLoading={verification.isLoading}
            error={verification.error}
            onEmpCodeChange={handleEmpCodeChange}
            onVerifyCode={handleVerifyCode}
            onKeyPress={handleKeyPress}
          />

          {verification.isVerified && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2"
            >
              <ReleaseChannelCard channel="stable" state={stable.state} onRetry={stable.retry} />
              <ReleaseChannelCard channel="beta" state={beta.state} onRetry={beta.retry} />
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
