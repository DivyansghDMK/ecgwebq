import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";

const navItems = [
  { href: "#overview", label: "Product" },
  { href: "#rhythm", label: "Rhythm system" },
  { href: "#gallery", label: "Screens" },
  { href: "#modes", label: "Display modes" },
  { href: "#analysis", label: "Analysis" },
  { href: "#device", label: "Device" },
  { href: "#support", label: "Support" }
];

const linkClass =
  "text-[0.8rem] font-medium text-white/70 transition hover:text-white focus-visible:outline-none focus-visible:text-white focus-visible:underline";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-ink/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[84rem] items-center gap-8 px-5 sm:px-8">
        <a href="#hero" className="flex-none" aria-label="CardioX home">
          <Logo />
        </a>

        <nav className="hidden flex-1 items-center gap-7 md:flex" aria-label="Sections">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className={linkClass}>
              {item.label}
            </a>
          ))}
        </nav>

        <a
          href="#login-section"
          className="ml-auto hidden rounded-full bg-brand-orange px-5 py-2 text-[0.8rem] font-semibold text-ink transition hover:bg-[#ff7d38] md:inline-flex"
        >
          Log in
        </a>

        <button
          className="ml-auto text-white/80 transition hover:text-white md:hidden"
          onClick={() => setIsOpen((open) => !open)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-white/10 bg-ink md:hidden">
          <div className="mx-auto flex max-w-[84rem] flex-col px-5 pb-5 pt-2 sm:px-8">
            {[...navItems, { href: "#login-section", label: "Log in" }].map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="border-b border-white/10 py-3.5 text-base font-medium text-white/85"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
