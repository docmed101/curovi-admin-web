"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  Users,
  Settings2,
  CalendarDays,
  UserSquare,
  LogOut,
  ChevronDown,
  CreditCard,
  Tag,
  SlidersHorizontal,
  ClipboardList,
  Bell,
} from "lucide-react";
import { useState } from "react";
import { clearAdminToken } from "@/lib/auth";

const MASTER_TABLES = [
  { key: "diagnoses",      label: "Diagnoses" },
  { key: "medicines",      label: "Medicines" },
  { key: "specialties",    label: "Specialties" },
  { key: "qualifications", label: "Qualifications" },
  { key: "councils",       label: "Councils" },
  { key: "lab-tests",      label: "Lab Tests" },
];

const SUBSCRIPTION_ITEMS = [
  { href: "/subscription",          label: "Plans",   icon: CreditCard },
  { href: "/subscription/coupons",  label: "Coupons", icon: Tag },
];

const TOP_NAV = [
  { href: "/dashboard",    label: "Dashboard",    icon: LayoutDashboard },
  { href: "/providers",    label: "Providers",    icon: Users },
  { href: "/patients",     label: "Patients",     icon: UserSquare },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/audit-logs",   label: "Audit Logs",   icon: ClipboardList },
  { href: "/config",       label: "App Config",   icon: Settings2 },
  { href: "/settings",     label: "Org Settings", icon: SlidersHorizontal },
];

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [masterOpen, setMasterOpen] = useState(pathname.startsWith("/master"));
  const [subOpen, setSubOpen] = useState(pathname.startsWith("/subscription"));

  function logout() {
    clearAdminToken();
    router.push("/login");
  }

  return (
    <aside className="w-56 flex-shrink-0 bg-gray-900 text-gray-300 flex flex-col h-full">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-gray-700">
        <span className="text-white font-bold text-sm tracking-tight">
          Curovi <span className="text-indigo-400">Admin</span>
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {TOP_NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-indigo-600 text-white font-semibold"
                  : "hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}

        {/* Subscription expandable section */}
        <div>
          <button
            onClick={() => setSubOpen((o) => !o)}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm w-full transition-colors",
              pathname.startsWith("/subscription")
                ? "bg-gray-800 text-white"
                : "hover:bg-gray-800 hover:text-white"
            )}
          >
            <CreditCard size={15} />
            <span className="flex-1 text-left">Subscriptions</span>
            <ChevronDown
              size={13}
              className={cn("transition-transform", subOpen && "rotate-180")}
            />
          </button>
          {subOpen && (
            <div className="ml-5 mt-0.5 space-y-0.5 border-l border-gray-700 pl-3">
              {SUBSCRIPTION_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors",
                      active ? "text-indigo-400 font-semibold" : "hover:text-white"
                    )}
                  >
                    <Icon size={12} />
                    {label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Master data expandable section */}
        <div>
          <button
            onClick={() => setMasterOpen((o) => !o)}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm w-full transition-colors",
              pathname.startsWith("/master")
                ? "bg-gray-800 text-white"
                : "hover:bg-gray-800 hover:text-white"
            )}
          >
            <Database size={15} />
            <span className="flex-1 text-left">Master Data</span>
            <ChevronDown
              size={13}
              className={cn(
                "transition-transform",
                masterOpen && "rotate-180"
              )}
            />
          </button>
          {masterOpen && (
            <div className="ml-5 mt-0.5 space-y-0.5 border-l border-gray-700 pl-3">
              {MASTER_TABLES.map(({ key, label }) => {
                const href = `/master/${key}`;
                const active = pathname === href;
                return (
                  <Link
                    key={key}
                    href={href}
                    className={cn(
                      "block px-2 py-1.5 rounded text-xs transition-colors",
                      active
                        ? "text-indigo-400 font-semibold"
                        : "hover:text-white"
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      <div className="px-3 pb-4 border-t border-gray-700 pt-3">
        <button
          onClick={logout}
          className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-sm hover:bg-red-900/50 hover:text-red-300 transition-colors"
        >
          <LogOut size={15} />
          Logout
        </button>
        <p className="text-center text-xs text-gray-600 mt-2">v{process.env.NEXT_PUBLIC_APP_VERSION}</p>
      </div>
    </aside>
  );
}
