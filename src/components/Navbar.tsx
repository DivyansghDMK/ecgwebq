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
  { href: "#support", label: "Support" },
];

const navLinkClass =
  "font-medium uppercase text-white/70 transition hover:text-white";
const navLinkStyle = {
  fontSize: "0.65rem",
  letterSpacing: "0.12em",
  whiteSpace: "nowrap" as const,
};

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 w-full bg-slate-950/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Logo */}
        <div className="flex-none">
          <Logo />
        </div>

        {/* Desktop Nav — hidden below lg */}
        <nav className="hidden lg:flex items-center justify-center flex-1 gap-x-4 xl:gap-x-6">
          {navItems.map((item) =>
            item.href.startsWith("/") ? (
              <Link
                key={item.href}
                to={item.href}
                style={navLinkStyle}
                className={navLinkClass}
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.href}
                href={item.href}
                style={navLinkStyle}
                className={navLinkClass}
              >
                {item.label}
              </a>
            )
          )}
          <a href="#login-section" style={navLinkStyle} className={navLinkClass}>
            Login
          </a>
        </nav>

        {/* Hamburger — visible below lg */}
        <button
          type="button"
          className="ml-auto inline-flex lg:hidden items-center justify-center rounded-full border border-white/15 p-2 text-white/80"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Toggle navigation"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-y-auto border-t border-white/10 lg:hidden"
          >
            <div className="space-y-3 px-6 pb-6 pt-4">
              {navItems.map((item) =>
                item.href.startsWith("/") ? (
                  <motion.div
                    key={item.href}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      to={item.href}
                      className={cn(
                        "block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[0.75rem] font-medium uppercase tracking-[0.2em] text-white/80 transition",
                        "hover:bg-white/10 hover:text-white"
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ) : (
                  <motion.a
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[0.75rem] font-medium uppercase tracking-[0.2em] text-white/80 transition",
                      "hover:bg-white/10 hover:text-white"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </motion.a>
                )
              )}
              <motion.a
                href="#login-section"
                className={cn(
                  "block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[0.75rem] font-medium uppercase tracking-[0.2em] text-white/80 transition",
                  "hover:bg-white/10 hover:text-white"
                )}
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
