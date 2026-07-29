import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Box, VStack, HStack, Image, Heading, Text } from '@chakra-ui/react';

// ---------------------------------------------------------------------------
// Shared heartbeat clock
// ---------------------------------------------------------------------------
// A single timing definition drives every synchronized element (logo, aura,
// card glow/box-shadow, heart icon) so nothing can drift out of phase.
// Pattern: lub (small pulse) -> brief relax -> dub (bigger pulse) -> diastole
// (rest/pause) before the cycle repeats. This mimics a real cardiac cycle
// rather than a generic evenly-spaced pulse.

const BEAT_DURATION = 1.15; // seconds per full lub-dub-pause cycle
const BEAT_TIMES = [0, 0.07, 0.15, 0.22, 0.35, 1];

const heartbeatTransition = {
  duration: BEAT_DURATION,
  times: BEAT_TIMES,
  repeat: Infinity,
  ease: 'easeInOut' as const,
};

const logoScaleKeyframes = [1, 1.05, 0.98, 1.1, 1, 1];
const logoGlowKeyframes = [
  'drop-shadow(0 0 0px rgba(255, 107, 26, 0))',
  'drop-shadow(0 0 10px rgba(255, 107, 26, 0.45))',
  'drop-shadow(0 0 2px rgba(255, 107, 26, 0.1))',
  'drop-shadow(0 0 16px rgba(255, 107, 26, 0.6))',
  'drop-shadow(0 0 0px rgba(255, 107, 26, 0))',
  'drop-shadow(0 0 0px rgba(255, 107, 26, 0))',
];

const auraScaleKeyframes = [1, 1.12, 1.0, 1.22, 1, 1];
const auraOpacityKeyframes = [0.5, 0.85, 0.55, 1, 0.5, 0.5];

const cardGlowScaleKeyframes = [1, 1.05, 1.0, 1.09, 1, 1];
const cardGlowOpacityKeyframes = [0.35, 0.6, 0.4, 0.78, 0.35, 0.35];

const CARD_BASE_SHADOW =
  '0 25px 60px -15px rgba(9, 11, 22, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)';
const cardBoxShadowKeyframes = [
  `${CARD_BASE_SHADOW}, 0 0 0px rgba(255, 107, 26, 0)`,
  `${CARD_BASE_SHADOW}, 0 0 35px rgba(255, 107, 26, 0.35)`,
  `${CARD_BASE_SHADOW}, 0 0 10px rgba(255, 107, 26, 0.12)`,
  `${CARD_BASE_SHADOW}, 0 0 55px rgba(255, 107, 26, 0.45)`,
  `${CARD_BASE_SHADOW}, 0 0 0px rgba(255, 107, 26, 0)`,
  `${CARD_BASE_SHADOW}, 0 0 0px rgba(255, 107, 26, 0)`,
];

const heartScaleKeyframes = [1, 1.12, 0.96, 1.22, 1, 1];
const heartGlowKeyframes = [
  'drop-shadow(0 0 0px rgba(255, 107, 26, 0))',
  'drop-shadow(0 0 4px rgba(255, 107, 26, 0.6))',
  'drop-shadow(0 0 1px rgba(255, 107, 26, 0.2))',
  'drop-shadow(0 0 7px rgba(255, 107, 26, 0.85))',
  'drop-shadow(0 0 0px rgba(255, 107, 26, 0))',
  'drop-shadow(0 0 0px rgba(255, 107, 26, 0))',
];

// Simple, license-free heart glyph (own geometry, not from an icon set)
const HeartIcon = () => (
  <motion.svg
    width="18"
    height="18"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    animate={{
      scale: heartScaleKeyframes,
      filter: heartGlowKeyframes,
    }}
    transition={heartbeatTransition}
    style={{ transformOrigin: 'center' }}
  >
    <path
      d="M16 28C16 28 4 20 4 12C4 6 9 3 13 6C14.5 7 16 9 16 9C16 9 17.5 7 19 6C23 3 28 6 28 12C28 20 16 28 16 28Z"
      fill="#ff6b1a"
    />
  </motion.svg>
);

export const SplashScreen = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Increment progress to 100 over 2.5 seconds
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 45);

    // Hide splash screen after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <Box
          as={motion.div}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          position="fixed"
          inset={0}
          zIndex={99999}
          background="linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="100vh"
          overflow="hidden"
        >
          {/* Decorative ambient background glows */}
          <Box
            position="absolute"
            top="-15%"
            left="-15%"
            width="60vw"
            height="60vh"
            background="radial-gradient(circle, rgba(255, 107, 26, 0.08) 0%, rgba(255, 107, 26, 0) 70%)"
            filter="blur(80px)"
            pointerEvents="none"
          />
          <Box
            position="absolute"
            bottom="-15%"
            right="-15%"
            width="60vw"
            height="60vh"
            background="radial-gradient(circle, rgba(255, 186, 102, 0.08) 0%, rgba(255, 186, 102, 0) 70%)"
            filter="blur(80px)"
            pointerEvents="none"
          />

          {/* Animated ECG background waves */}
          <Box
            position="absolute"
            inset={0}
            width="100%"
            height="100%"
            pointerEvents="none"
            zIndex={0}
          >
            {/* Top/Secondary ECG Wave */}
            <Box
              position="absolute"
              top="15%"
              left={0}
              width="100%"
              height="150px"
              opacity={0.18}
            >
              <svg width="100%" height="100%" viewBox="0 0 1100 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="ecg-gradient-top" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ffd199" stopOpacity="0.15" />
                    <stop offset="50%" stopColor="#ffa15c" stopOpacity="1" />
                    <stop offset="100%" stopColor="#ffd199" stopOpacity="0.15" />
                  </linearGradient>
                  <filter id="ecg-glow-top" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2.2" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {/* Static base wave background */}
                <path
                  d="M 0 100 L 100 100 C 110 100, 115 85, 125 85 C 135 85, 140 100, 150 100 L 160 110 L 175 15 L 190 170 L 200 100 C 210 100, 225 75, 235 75 C 245 75, 250 100, 260 100 L 450 100 C 460 100, 465 85, 475 85 C 485 85, 490 100, 500 100 L 510 110 L 525 15 L 540 170 L 550 100 C 560 100, 575 75, 585 75 C 595 75, 600 100, 610 100 L 800 100 C 810 100, 815 85, 825 85 C 835 85, 840 100, 850 100 L 860 110 L 875 15 L 890 170 L 900 100 C 910 100, 925 75, 935 75 C 945 75, 950 100, 960 100 L 1100 100"
                  fill="none"
                  stroke="rgba(255, 138, 61, 0.15)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Active sweep pulse */}
                <motion.path
                  d="M 0 100 L 100 100 C 110 100, 115 85, 125 85 C 135 85, 140 100, 150 100 L 160 110 L 175 15 L 190 170 L 200 100 C 210 100, 225 75, 235 75 C 245 75, 250 100, 260 100 L 450 100 C 460 100, 465 85, 475 85 C 485 85, 490 100, 500 100 L 510 110 L 525 15 L 540 170 L 550 100 C 560 100, 575 75, 585 75 C 595 75, 600 100, 610 100 L 800 100 C 810 100, 815 85, 825 85 C 835 85, 840 100, 850 100 L 860 110 L 875 15 L 890 170 L 900 100 C 910 100, 925 75, 935 75 C 945 75, 950 100, 960 100 L 1100 100"
                  fill="none"
                  stroke="url(#ecg-gradient-top)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#ecg-glow-top)"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
              </svg>
            </Box>

            {/* Bottom/Main ECG Wave */}
            <Box
              position="absolute"
              bottom="15%"
              left={0}
              width="100%"
              height="200px"
              opacity={0.36}
            >
              <svg width="100%" height="100%" viewBox="0 0 1100 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="ecg-gradient-bottom" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ff6b1a" stopOpacity="0.2" />
                    <stop offset="50%" stopColor="#ff9142" stopOpacity="1" />
                    <stop offset="85%" stopColor="#ff6b1a" stopOpacity="1" />
                    <stop offset="100%" stopColor="#ffba66" stopOpacity="0.2" />
                  </linearGradient>
                  <filter id="ecg-glow-bottom" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3.2" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {/* Static base wave background */}
                <path
                  d="M 0 100 L 100 100 C 110 100, 115 85, 125 85 C 135 85, 140 100, 150 100 L 160 110 L 175 15 L 190 170 L 200 100 C 210 100, 225 75, 235 75 C 245 75, 250 100, 260 100 L 450 100 C 460 100, 465 85, 475 85 C 485 85, 490 100, 500 100 L 510 110 L 525 15 L 540 170 L 550 100 C 560 100, 575 75, 585 75 C 595 75, 600 100, 610 100 L 800 100 C 810 100, 815 85, 825 85 C 835 85, 840 100, 850 100 L 860 110 L 875 15 L 890 170 L 900 100 C 910 100, 925 75, 935 75 C 945 75, 950 100, 960 100 L 1100 100"
                  fill="none"
                  stroke="rgba(255, 107, 26, 0.25)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Active sweep pulse */}
                <motion.path
                  d="M 0 100 L 100 100 C 110 100, 115 85, 125 85 C 135 85, 140 100, 150 100 L 160 110 L 175 15 L 190 170 L 200 100 C 210 100, 225 75, 235 75 C 245 75, 250 100, 260 100 L 450 100 C 460 100, 465 85, 475 85 C 485 85, 490 100, 500 100 L 510 110 L 525 15 L 540 170 L 550 100 C 560 100, 575 75, 585 75 C 595 75, 600 100, 610 100 L 800 100 C 810 100, 815 85, 825 85 C 835 85, 840 100, 850 100 L 860 110 L 875 15 L 890 170 L 900 100 C 910 100, 925 75, 935 75 C 945 75, 950 100, 960 100 L 1100 100"
                  fill="none"
                  stroke="url(#ecg-gradient-bottom)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#ecg-glow-bottom)"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
              </svg>
            </Box>
          </Box>

          {/* Dynamic ambient glow overlay behind the card, pulsing with the heartbeat */}
          <Box
            as={motion.div}
            position="absolute"
            width={{ base: '340px', md: '460px' }}
            height={{ base: '340px', md: '460px' }}
            borderRadius="full"
            background="radial-gradient(circle, rgba(255, 107, 26, 0.22) 0%, rgba(255, 107, 26, 0) 72%)"
            filter="blur(50px)"
            pointerEvents="none"
            zIndex={0}
            animate={{
              scale: cardGlowScaleKeyframes,
              opacity: cardGlowOpacityKeyframes,
            }}
            transition={heartbeatTransition}
            style={{ transformOrigin: 'center' }}
          />

          {/* Premium Glassmorphic Card Container */}
          <VStack
            as={motion.div}
            initial={{ scale: 0.93, opacity: 0, y: 15 }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
              boxShadow: cardBoxShadowKeyframes,
            }}
            transition={{
              scale: { duration: 0.8, ease: 'easeOut' },
              opacity: { duration: 0.8, ease: 'easeOut' },
              y: { duration: 0.8, ease: 'easeOut' },
              boxShadow: { ...heartbeatTransition, delay: 0.8 },
            }}
            gap={6}
            p={{ base: 8, md: 12 }}
            borderRadius="3xl"
            backgroundColor="rgba(255, 255, 255, 0.7)"
            backdropFilter="blur(24px)"
            border="1px solid rgba(255, 255, 255, 0.6)"
            maxWidth="md"
            width="90%"
            alignItems="center"
            position="relative"
            zIndex={1}
          >
            {/* Pulsing glow directly behind the logo, synced to the same beat */}
            <Box
              as={motion.div}
              position="absolute"
              top="20%"
              left="50%"
              width="150px"
              height="150px"
              background="radial-gradient(circle, rgba(255, 107, 26, 0.16) 0%, rgba(255, 107, 26, 0) 70%)"
              filter="blur(25px)"
              pointerEvents="none"
              animate={{
                scale: auraScaleKeyframes,
                opacity: auraOpacityKeyframes,
              }}
              transition={heartbeatTransition}
              style={{ x: '-50%', transformOrigin: 'center' }}
            />

            {/* Logo Image */}
            <Box position="relative" zIndex={1}>
              <motion.div
                animate={{
                  y: [0, -6, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <motion.div
                  animate={{
                    scale: logoScaleKeyframes,
                    filter: logoGlowKeyframes,
                  }}
                  transition={heartbeatTransition}
                  style={{ transformOrigin: 'center' }}
                >
                  <Image
                    src="/cardiox-heart-only.png"
                    alt="CardioX Logo"
                    width="160px"
                    height="160px"
                    objectFit="contain"
                  />
                </motion.div>
              </motion.div>
            </Box>

            {/* Brand Titles & Powered by */}
            <VStack gap={2} zIndex={1} width="full" alignItems="center">
              <Text
                fontSize="3xs"
                fontWeight="extrabold"
                letterSpacing="0.3em"
                color="rgba(15, 23, 42, 0.4)"
                textTransform="uppercase"
                fontFamily="'Inter', sans-serif"
                margin={0}
                textAlign="center"
              >
                Powered by
              </Text>
              <Image
                src="/deckmount-logo-new.png"
                alt="Deckmount Logo"
                width="160px"
                height="45px"
                objectFit="contain"
              />
            </VStack>

            {/* Premium Progress Bar with synced heart-rate indicator */}
            <Box width="full" px={4} mt={3} zIndex={1}>
              <HStack width="full" gap={2} mb={2} justifyContent="center" alignItems="center">
                <HeartIcon />
                <Text
                  fontSize="2xs"
                  fontWeight="semibold"
                  letterSpacing="0.15em"
                  color="rgba(15, 23, 42, 0.45)"
                  textTransform="uppercase"
                  fontFamily="'Inter', sans-serif"
                  margin={0}
                >
                  Loading
                </Text>
              </HStack>
              <Box
                width="full"
                height="5px"
                backgroundColor="rgba(9, 11, 22, 0.08)"
                borderRadius="full"
                overflow="hidden"
                position="relative"
              >
                <Box
                  as={motion.div}
                  position="absolute"
                  top={0}
                  left={0}
                  bottom={0}
                  background="linear-gradient(90deg, #ff6b1a 0%, #ff8a3d 50%, #ffba66 100%)"
                  width={`${progress}%`}
                  borderRadius="full"
                />
              </Box>
            </Box>
          </VStack>
        </Box>
      )}
    </AnimatePresence>
  );
};
