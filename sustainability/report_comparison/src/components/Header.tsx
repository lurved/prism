"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// hrefs are basePath-relative; Next <Link> prepends the configured basePath.
const navItems = [
  { label: "Temasek", href: "/" },
  { label: "Utility", href: "/infra" },
  { label: "Banks", href: "/banks" },
];

const SUBTITLES: Record<string, string> = {
  "/": "Temasek Portfolio",
  "/infra": "Electricity Utility",
  "/banks": "Singapore Banks",
};

function isActive(pathname: string | null, href: string): boolean {
  const path = (pathname ?? "/").replace(/\/$/, "") || "/";
  if (href === "/") return path === "/";
  return path === href || path.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const path = (pathname ?? "/").replace(/\/$/, "") || "/";
  const subtitle = SUBTITLES[path] ?? "ESG Comparison";

  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-paper/[0.86] backdrop-blur-md backdrop-saturate-150">
      <div className="max-w-page mx-auto px-5 sm:px-8 py-[13px] flex items-center justify-between gap-6">
        <div className="flex items-baseline gap-[13px]">
          <span className="font-serif font-semibold text-base text-ink tracking-[0.005em]">ESG Tracker</span>
          <span className="font-mono font-medium text-[10px] text-muted2 tracking-[0.14em] uppercase hidden sm:inline">
            {subtitle}
          </span>
        </div>
        <nav className="flex gap-[5px]">
          {navItems.map(({ label, href }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={
                  active
                    ? "font-sans font-semibold text-xs tracking-[0.02em] px-[13px] py-[7px] rounded-full bg-ink text-paper"
                    : "font-sans font-semibold text-xs tracking-[0.02em] px-[13px] py-[7px] rounded-full text-muted border border-hairline hover:bg-chip hover:text-ink transition-colors"
                }
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
