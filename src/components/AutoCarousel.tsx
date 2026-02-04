import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AutoCarouselProps {
  images: Array<{
    src: string;
    alt: string;
  }>;
  className?: string;
  interval?: number;
}

export function AutoCarousel({
  images,
  className,
  interval = 3000
}: AutoCarouselProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, interval);

    return () => window.clearInterval(timer);
  }, [images.length, interval]);

  const current = images[index];

  return (
    <div className={cn("relative overflow-hidden rounded-3xl", className)}>
      <AnimatePresence initial={false}>
        <motion.img
          key={current.src}
          src={current.src}
          alt={current.alt}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-contain sm:object-cover"
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: "0%", opacity: 1 }}
          exit={{ x: "-100%", opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />
      </AnimatePresence>
    </div>
  );
}

