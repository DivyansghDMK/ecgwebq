import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "#hero", label: "Overview" },
  { href: "#gallery", label: "Gallery" },
  { href: "#overview", label: "Product" },
  { href: "#features", label: "Highlights" },
  { href: "#dashboard", label: "Dashboard" },
  { href: "#control", label: "Control" },
  { href: "#modes", label: "Modes" },
  { href: "#analysis", label: "Analysis" },
  { href: "#waveform-analysis", label: "Waveform" },
  { href: "#device", label: "Device" },
  { href: "#support", label: "Support" }
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 bg-slate-950/75 backdrop-blur-xl"
      style={{ minWidth: "1024px" }}
    >
      <div
        className="mx-auto flex items-center px-8 py-3"
        style={{ maxWidth: "1280px", height: "64px" }}
      >
        <div className="flex-none">
          <Logo />
        </div>
        <nav
          className="flex flex-1 items-center justify-center"
          style={{ gap: "1.5rem" }}
        >
          {navItems.map((item) =>
            item.href.startsWith("/") ? (
              <Link
                key={item.href}
                to={item.href}
                style={{ fontSize: "0.65rem", letterSpacing: "0.18em", whiteSpace: "nowrap" }}
                className="font-medium uppercase text-white/70 transition hover:text-white"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.href}
                href={item.href}
                style={{ fontSize: "0.65rem", letterSpacing: "0.18em", whiteSpace: "nowrap" }}
                className="font-medium uppercase text-white/70 transition hover:text-white"
              >
                {item.label}
              </a>
            )
          )}
          <a
            href="#login-section"
            style={{ fontSize: "0.65rem", letterSpacing: "0.18em", whiteSpace: "nowrap" }}
            className="font-medium uppercase text-white/70 transition hover:text-white"
          >
            Login
          </a>
        </nav>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-y-auto border-t border-white/10"
          >
            <div className="space-y-4 px-6 pb-6 pt-4">
              {navItems.map((item) =>
                item.href.startsWith("/") ? (
                  <motion.div key={item.href} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      to={item.href}
                      className={cn("block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[0.75rem] font-medium uppercase tracking-[0.28em] text-white/80 transition", "hover:bg-white/10 hover:text-white")}
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ) : (
                  <motion.a
                    key={item.href}
                    href={item.href}
                    className={cn("block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[0.75rem] font-medium uppercase tracking-[0.28em] text-white/80 transition", "hover:bg-white/10 hover:text-white")}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </motion.a>
                )
              )}
              <motion.a
                href="#login-section"
                className={cn("block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[0.75rem] font-medium uppercase tracking-[0.28em] text-white/80 transition", "hover:bg-white/10 hover:text-white")}
                onClick={() => setIsOpen(false)}
              >
                Login
              </motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
