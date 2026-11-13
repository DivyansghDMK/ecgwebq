import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { VersionHero } from '@/components/VersionHero';
import { VersionCard } from '@/components/VersionCard';
import { ReleaseChannelCard } from '@/components/releases/ReleaseChannelCard';
import { useVersionVerification } from '@/hooks/useVersionVerification';
import { useLatestRelease } from '@/hooks/useLatestRelease';
import { logDownload } from '@/services/downloads/downloadsApi';
import { startInstallerDownload } from '@/services/downloads/startDownload';
import type { Channel, LatestRelease } from '@/services/releases/types';

export const MSG_ACCESS_REVOKED = 'Your download access is no longer active. Please contact the admin.';
const MSG_DOWNLOAD_UNAVAILABLE = 'This download is not available right now. Please try again later.';

type CardStatus = { busy: boolean; error: string | null };
const IDLE: Record<Channel, CardStatus> = {
  stable: { busy: false, error: null },
  beta: { busy: false, error: null },
};

export default function VersionDownloadPage() {
  const [empCode, setEmpCode] = useState('');
  const { verification, verifyCode, resetVerification, isLocked } = useVersionVerification();
  const stable = useLatestRelease('stable');
  const beta = useLatestRelease('beta');

  const [cards, setCards] = useState<Record<Channel, CardStatus>>(IDLE);
  /** Set after a 403 from the log call: cards stay visible with the error, downloads disabled. */
  const [accessRevoked, setAccessRevoked] = useState(false);
  const logControllerRef = useRef<AbortController | null>(null);
  const busyRef = useRef<Record<Channel, boolean>>({ stable: false, beta: false });

  // Leaving the page aborts any in-flight log call (so no download starts afterwards).
  useEffect(
    () => () => {
      logControllerRef.current?.abort();
    },
    []
  );

  const cancelLogCall = () => {
    logControllerRef.current?.abort();
    logControllerRef.current = null;
    busyRef.current = { stable: false, beta: false };
  };

  const handleVerifyCode = () => {
    if (empCode.trim()) {
      setAccessRevoked(false);
      setCards(IDLE);
      verifyCode(empCode.trim());
    }
  };

  const handleEmpCodeChange = (value: string) => {
    setEmpCode(value);
    // Any change clears the verified name and code (and cancels pending requests).
    if (verification.isVerified || verification.isLoading || accessRevoked) {
      cancelLogCall();
      setAccessRevoked(false);
      setCards(IDLE);
      resetVerification();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerifyCode();
    }
  };

  const verifiedCode = verification.isVerified ? verification.verifiedCode : null;

  const handleDownload = useCallback(
    async (release: LatestRelease) => {
      const channel = release.channel;
      if (!verifiedCode || busyRef.current[channel]) {
        return;
      }
      busyRef.current[channel] = true;
      setCards((prev) => ({ ...prev, [channel]: { busy: true, error: null } }));

      logControllerRef.current?.abort();
      const controller = new AbortController();
      logControllerRef.current = controller;

      const result = await logDownload(
        { empCode: verifiedCode, channel, version: release.version },
        { signal: controller.signal }
      );
      if (controller.signal.aborted) {
        // Page left or code changed while logging: do nothing.
        return;
      }
      logControllerRef.current = null;
      busyRef.current[channel] = false;

      if (result === 'not_allowed') {
        setAccessRevoked(true);
        setCards({ ...IDLE, [channel]: { busy: false, error: MSG_ACCESS_REVOKED } });
        resetVerification();
        return;
      }
      if (result === 'failed') {
        // Never block an employee because logging failed. No personal data in the log.
        console.warn('Download log request failed; starting the download anyway.');
      }
      const started = startInstallerDownload(release.download_url);
      setCards((prev) => ({ ...prev, [channel]: { busy: false, error: started ? null : MSG_DOWNLOAD_UNAVAILABLE } }));
    },
    [verifiedCode, resetVerification]
  );

  const showCards = verification.isVerified || accessRevoked;

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
            isLocked={isLocked}
            onEmpCodeChange={handleEmpCodeChange}
            onVerifyCode={handleVerifyCode}
            onKeyPress={handleKeyPress}
          />

          {showCards && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2"
            >
              {(['stable', 'beta'] as const).map((channel) => {
                const source = channel === 'stable' ? stable : beta;
                return (
                  <ReleaseChannelCard
                    key={channel}
                    channel={channel}
                    state={source.state}
                    onRetry={source.retry}
                    onDownload={handleDownload}
                    downloadBusy={cards[channel].busy}
                    downloadError={cards[channel].error}
                    downloadDisabled={!verification.isVerified}
                  />
                );
              })}
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
