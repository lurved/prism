"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, GitCompare, Building2, Leaf, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

// NOTE: hrefs are relative to the configured basePath
// (/sustainability/report_comparison). Next.js <Link> prepends basePath
// automatically, and usePathname() returns paths WITHOUT it.
const navItems = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Compare", href: "/compare", icon: GitCompare },
  { label: "Dense-City Peers", href: "/peers", icon: Building2 },
];

function isActive(pathname: string | null, href: string): boolean {
  const path = (pathname ?? "/").replace(/\/$/, "") || "/";
  if (href === "/") return path === "/";
  return path === href || path.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 flex-shrink-0 hidden md:flex flex-col h-screen sticky top-0 bg-slate-900 text-white">
      <div className="px-5 py-6 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-white leading-tight">Temasek ESG</p>
            <p className="text-[10px] text-slate-400 leading-tight">Portfolio Tracker</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ label, href, icon: Icon }) => {
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

      <div className="px-4 pb-5 border-t border-slate-800 pt-4">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Companies</p>
        {[
          { name: "Sembcorp", color: "#259466" },
          { name: "SMRT", color: "#c8102e" },
          { name: "Singtel", color: "#e05a1e" },
        ].map((c) => (
          <div key={c.name} className="flex items-center gap-2 py-1.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
            <span className="text-xs text-slate-400">{c.name}</span>
          </div>
        ))}
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
      {navItems.map(({ label, href, icon: Icon }) => {
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
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
