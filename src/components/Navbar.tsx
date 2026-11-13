"use client";

import { useState, useEffect } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "Why AutoDrive", href: "/why-autodrive" },
  { label: "Updates", href: "/updates" },
  { label: "FAQ", href: "/faq" },
];

const IOS_WAITLIST_URL = "https://forms.gle/G3Z2agiFyVE1cEWj8";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href;
  };

  return (
    <>
      {pathname !== "/" && <aside aria-label="AutoDrive Android app" className="border-b border-white/10 bg-navy text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-3 text-center sm:flex-row sm:gap-5 sm:px-8 sm:text-left">
          <div className="flex flex-col items-center gap-1 sm:items-start lg:flex-row lg:items-center lg:gap-4">
            <span className="text-[11px] font-bold uppercase tracking-widest text-gold">
              Now available on Android
            </span>
            <p className="text-sm font-medium">Your papers renewed. Your day uninterrupted.</p>
          </div>
          <a
            href="https://play.google.com/store/apps/details?id=com.ipinnu.AutodriveNew"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-bold text-navy transition-colors hover:bg-gold hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <svg width="20" height="22" viewBox="0 0 24 26" fill="none" aria-hidden="true" className="shrink-0">
              <path d="M1 1L14 13L1 25V1Z" fill="#4285F4" />
              <path d="M1 1L17.5 10L14 13L1 1Z" fill="#34A853" />
              <path d="M1 25L14 13L17.5 16L1 25Z" fill="#EA4335" />
              <path d="M14 13L17.5 10L23 13L17.5 16L14 13Z" fill="#FBBC04" />
            </svg>
            Get the app
          </a>
        </div>
      </aside>}
      {/* Navbar */}
      <nav
        className={`sticky top-0 z-50 bg-white transition-all duration-300 ${
          scrolled ? "shadow-md py-3" : "py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/images/logo-full.png"
              alt="AutoDrive"
              width={160}
              height={52}
              className="h-10 md:h-14 w-auto"
              priority
            />
          </Link>

          {/* Desktop links */}
          <div className="hidden xl:flex items-center gap-5 text-[14px] font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors whitespace-nowrap ${
                  isActive(link.href)
                    ? "text-gold font-semibold"
                    : "text-navy/70 hover:text-gold"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA + hamburger */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href="/renew" className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy">
              Renew now <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href={IOS_WAITLIST_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-2 bg-black hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black text-white text-sm font-semibold px-4 py-2.5 rounded-full transition-colors whitespace-nowrap"
            >
              <Image src="/images/apple-logo.svg" alt="" width={20} height={20} aria-hidden="true" />
              Join the iOS waitlist
            </a>
            <button
              className="xl:hidden p-2 text-navy"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="xl:hidden fixed inset-0 top-[calc(var(--nav-height,112px))] bg-white z-40 flex flex-col px-6 pt-8 pb-10 gap-1 overflow-y-auto"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`text-xl font-medium border-b border-gray-100 py-4 ${
                    isActive(link.href) ? "text-gold font-semibold" : "text-navy"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/renew" onClick={() => setMenuOpen(false)} className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-navy px-6 py-4 text-lg font-bold text-white">
                Renew now <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              <a
                href={IOS_WAITLIST_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center justify-center gap-2 bg-black hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black text-white text-center font-semibold px-6 py-4 rounded-full text-lg"
                onClick={() => setMenuOpen(false)}
              >
                <Image src="/images/apple-logo.svg" alt="" width={20} height={20} aria-hidden="true" />
              Join the iOS waitlist
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}


