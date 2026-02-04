import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "#hero", label: "Overview" },
  { href: "#gallery", label: "Gallery" },
  { href: "#overview", label: "Product" },
  { href: "#features", label: "Highlights" },
  { href: "#dashboard", label: "Dashboard" },
  { href: "#control", label: "Control" },
  { href: "#analysis", label: "Analysis" },
  { href: "#device", label: "Device" },
  { href: "#support", label: "Support" }
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-slate-950/75 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[5rem] w-full max-w-6xl items-center gap-4 px-3 py-3 sm:px-6">
        <div className="flex-none">
          <Logo />
        </div>
        <nav className="hidden flex-1 items-center justify-center gap-5 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[0.7rem] font-medium uppercase leading-tight tracking-[0.3em] text-white/70 transition hover:text-white"
            >
              {item.label}
            </a>
          ))}
          <a
            href="#login-section"
            className="text-[0.7rem] font-medium uppercase leading-tight tracking-[0.3em] text-white/70 transition hover:text-white"
          >
            Login
          </a>
        </nav>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full border border-white/15 p-2 text-white/80 md:hidden"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Toggle navigation"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10 md:hidden"
          >
            <div className="space-y-4 px-6 pb-6 pt-4">
              {navItems.map((item) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  className={cn(
                  "block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[0.75rem] font-medium uppercase tracking-[0.28em] text-white/80 transition",
                    "hover:bg-white/10 hover:text-white"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </motion.a>
              ))}
              <motion.a
                href="#login-section"
                className={cn(
                  "block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[0.75rem] font-medium uppercase tracking-[0.28em] text-white/80 transition",
                  "hover:bg-white/10 hover:text-white"
                )}
                onClick={() => setIsOpen(false)}
              >
                Login
              </motion.a>
              <Link
                to="mailto:sales@deckmount.com"
                className="block text-center text-xs uppercase tracking-[0.3em] text-white/60"
              >
                sales@deckmount.com
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

