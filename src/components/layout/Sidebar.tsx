"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "../../lib/utils";
import {
  LayoutDashboard,
  Package,
  Tag,
  Warehouse,
  ClipboardList,
  FileBarChart,
  Users,
  X,
} from "lucide-react";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/categories", label: "Categories", icon: Tag },
  { href: "/godowns", label: "Godowns", icon: Warehouse },
  { href: "/users", label: "User Management", icon: Users },
  { href: "/audit-logs", label: "Audit Logs", icon: ClipboardList },
  { href: "/reports", label: "Reports & Export", icon: FileBarChart },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-800 z-50 flex flex-col transition-transform duration-300",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-black/20 shrink-0 p-0.5 overflow-hidden">
              <Image src="/logo.png" alt="Rahul Motors" width={34} height={34} className="object-contain" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Rahul Motors</p>
              <p className="text-gray-500 text-xs">Admin Panel</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-amber-500/10 text-amber-400 border-l-2 border-amber-500 pl-[10px]"
                    : "text-gray-400 hover:text-white hover:bg-gray-800 border-l-2 border-transparent"
                )}
              >
                <Icon size={17} className={active ? "text-amber-400" : ""} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <p className="text-gray-600 text-xs text-center">
            © 2025 Rahul Motors
          </p>
        </div>
      </aside>
    </>
  );
}
