import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

// Single heartbeat clock (lub -> relax -> dub -> rest) shared by every pulsing
// element so the logo and the glow can never drift out of phase.
const BEAT_DURATION = 1.15;
const heartbeatTransition = {
  duration: BEAT_DURATION,
  times: [0, 0.07, 0.15, 0.22, 0.35, 1],
  repeat: Infinity,
  ease: 'easeInOut' as const,
};

const logoScale = [1, 1.05, 0.98, 1.1, 1, 1];
const glowScale = [1, 1.1, 1, 1.22, 1, 1];
const glowOpacity = [0.45, 0.7, 0.5, 0.95, 0.45, 0.45];

const SPLASH_MS = 3000;
const TICK_MS = 30;

// One PQRST cycle repeated across the viewBox; the sweep draws it left to right.
const ECG_PATH =
  'M0 60 H140 C150 60 155 48 165 48 C175 48 180 60 190 60 L205 66 L220 8 L236 108 L250 60 C262 60 275 36 288 36 C300 36 306 60 318 60 H600 ' +
  'M600 60 H740 C750 60 755 48 765 48 C775 48 780 60 790 60 L805 66 L820 8 L836 108 L850 60 C862 60 875 36 888 36 C900 36 906 60 918 60 H1200';

export const SplashScreen = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const interval = setInterval(() => {
      const elapsed = performance.now() - start;
      setProgress(Math.min(100, Math.round((elapsed / (SPLASH_MS - 400)) * 100)));
    }, TICK_MS);
    const timer = setTimeout(() => setIsVisible(false), SPLASH_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center overflow-hidden bg-[#090b16]"
        >
          {/* Grid + vignette, same language as the hero */}
          <div className="pointer-events-none absolute inset-0 bg-grid-dark bg-[size:40px_40px] opacity-30" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,107,26,0.10),rgba(9,11,22,0.96)_70%)]" />

          {/* ECG trace running behind the logo */}
          <div
            className="pointer-events-none absolute left-0 top-1/2 h-[120px] w-full -translate-y-[70%]"
            style={{
              maskImage: 'linear-gradient(90deg, transparent, #000 25%, #000 75%, transparent)',
              WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 25%, #000 75%, transparent)',
            }}
          >
            <svg width="100%" height="100%" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path
                d={ECG_PATH}
                fill="none"
                stroke="rgba(255,138,61,0.14)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <motion.path
                d={ECG_PATH}
                fill="none"
                stroke="#ff8a3d"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 0 6px rgba(255,107,26,0.8))' }}
                initial={{ pathLength: 0, opacity: 1 }}
                animate={{ pathLength: 1, opacity: [1, 1, 0] }}
                transition={{ duration: 2.4, ease: 'easeInOut', times: [0, 0.85, 1] }}
              />
            </svg>
          </div>

          {/* Logo with pulsing aura */}
          <div className="relative flex h-56 w-56 items-center justify-center sm:h-64 sm:w-64">
            <motion.div
              className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,107,26,0.35)_0%,rgba(255,107,26,0)_68%)] blur-2xl"
              animate={{ scale: glowScale, opacity: glowOpacity }}
              transition={heartbeatTransition}
            />
            <motion.img
              src="/cardiox-heart-only.png"
              alt="CardioX"
              className="relative h-36 w-36 object-contain sm:h-44 sm:w-44"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: logoScale }}
              transition={{
                opacity: { duration: 0.6 },
                scale: { ...heartbeatTransition, delay: 0.4 },
              }}
            />
          </div>

          {/* Wordmark */}
          <motion.div
            className="mt-2 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <h1 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Cardio<span className="text-brand-orange">X</span>
            </h1>
            <p className="mt-2 text-[11px] uppercase tracking-[0.4em] text-white/45">
              Built to detect. Designed to last.
            </p>
          </motion.div>

          {/* Progress */}
          <motion.div
            className="mt-10 w-64 sm:w-80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#ff6b1a] via-[#ff8a3d] to-[#ffba66]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-white/40">
              <span>Loading</span>
              <span className="tabular-nums">{progress}%</span>
            </div>
          </motion.div>

          {/* Powered by */}
          <motion.div
            className="absolute bottom-8 flex flex-col items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.7 }}
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/40">
              Powered by
            </span>
            <span className="rounded-xl bg-white px-4 py-2 shadow-[0_0_30px_rgba(255,255,255,0.06)]">
              <img src="/deckmount-logo-new.png" alt="Deckmount Electronics" className="h-8 w-auto object-contain" />
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
