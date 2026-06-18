"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Landmark, Building2, Banknote, Leaf, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

// NOTE: hrefs are relative to the configured basePath
// (/sustainability/report_comparison). Next.js <Link> prepends basePath
// automatically, and usePathname() returns paths WITHOUT it.
type NavItem = { label: string; short: string; href: string; icon: typeof Landmark };

const allNavItems: NavItem[] = [
  { label: "Temasek Portfolio", short: "Temasek", href: "/", icon: Landmark },
  { label: "Electricity Utility", short: "Utility", href: "/infra", icon: Building2 },
  { label: "Banks", short: "Banks", href: "/banks", icon: Banknote },
];

const DISCLAIMER =
  "This output was generated with AI assistance and may contain errors or omissions. " +
  "All figures, claims, and sources should be independently verified before use in " +
  "decision-making, reporting, or publication.";

function isActive(pathname: string | null, href: string): boolean {
  const path = (pathname ?? "/").replace(/\/$/, "") || "/";
  if (href === "/") return path === "/";
  return path === href || path.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 flex-shrink-0 hidden md:flex flex-col h-screen sticky top-0 bg-slate-900 text-white">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">ESG Tracker</p>
            <p className="text-[10px] text-slate-400 leading-tight">Sustainability Report Comparison</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {allNavItems.map(({ label, href, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-brand-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer: disclaimer, link */}
      <div className="px-4 pb-5 border-t border-slate-800 pt-4">
        {/* Disclaimer */}
        <div>
          <p className="text-[9px] leading-snug text-slate-500">
            <span className="font-semibold text-slate-400">Disclaimer:</span> {DISCLAIMER}
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800">
          <a
            href="https://pris.la"
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            pris.la
          </a>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 flex">
      {allNavItems.map(({ short, href, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
              active ? "text-brand-400" : "text-slate-500"
            )}
          >
            <Icon className="w-5 h-5" />
            {short}
          </Link>
        );
      })}
    </nav>
  );
}
