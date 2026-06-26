"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { Menu } from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";

type SidebarCtx = { open: boolean; toggle: () => void; close: () => void };
const SidebarContext = createContext<SidebarCtx>({ open: false, toggle: () => {}, close: () => {} });
export const useSidebar = () => useContext(SidebarContext);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  return (
    <SidebarContext value={{ open, toggle, close }}>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        {open && (
          <div
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={close}
          />
        )}
        <AdminSidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-2 bg-white border-b border-gray-200 md:hidden">
            <button onClick={toggle} className="p-1 -ml-1 text-gray-600">
              <Menu size={20} />
            </button>
            <span className="text-sm font-bold text-gray-900">
              Curovi <span className="text-indigo-400">Admin</span>
            </span>
          </div>
          {children}
        </main>
      </div>
    </SidebarContext>
  );
}
