import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <motion.img
        src="/cardiox-logo-horizontal.png"
        alt="CardioX by Deckmount Logo"
        className="h-10 w-auto object-contain cursor-pointer"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      />
    </div>
  );
}

