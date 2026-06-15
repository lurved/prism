import type { Metadata } from "next";
import "./globals.css";
import { Sidebar, MobileNav } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "ESG Tracker",
  description: "Compare sustainability metrics across Temasek portfolio companies: Sembcorp, SMRT, and Singtel.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-w-0 pb-20 md:pb-0">
            {children}
          </main>
        </div>
        <MobileNav />
      </body>
    </html>
  );
}
