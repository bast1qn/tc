"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  const pathname = usePathname();
  const isAdmin = pathname === "/admin";

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex items-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#E30613] rounded flex items-center justify-center">
                <Home className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div className="ml-3 hidden sm:block">
                <div className="text-lg md:text-xl font-bold text-[#E30613]">
                  Town & Country
                </div>
                <div className="text-xs md:text-sm text-gray-600 -mt-1">
                  Haus
                </div>
              </div>
            </div>
          </Link>

          {/* Page Title */}
          <div className="hidden md:block text-center">
            <h1 className="text-lg font-semibold text-gray-800">
              {isAdmin ? "Admin Dashboard" : "Gewährleistungsanfrage"}
            </h1>
          </div>

          {/* Navigation */}
          <nav>
            {isAdmin ? (
              <Link href="/">
                <Button
                  variant="outline"
                  className="border-[#E30613] text-[#E30613] hover:bg-[#E30613] hover:text-white transition-colors"
                >
                  <Home className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Zurück zum Formular</span>
                  <span className="sm:hidden">Formular</span>
                </Button>
              </Link>
            ) : (
              <Link href="/admin">
                <Button className="bg-[#E30613] hover:bg-[#C00510] text-white font-semibold">
                  <Settings className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Admin Dashboard</span>
                  <span className="sm:hidden">Admin</span>
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </div>

      {/* Red accent line */}
      <div className="h-1 bg-gradient-to-r from-[#E30613] via-[#E30613] to-transparent" />
    </header>
  );
}
