"use client";

import { Sidebar } from "@/components/features/admin-panel/sidebar";
import { SidebarProvider } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";

interface SharedAdminLayoutProps {
  children: React.ReactNode;
}

export function SharedAdminLayout({ children }: SharedAdminLayoutProps) {
  return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 lg:ml-[90px] transition-all duration-300 ease-in-out">
          <div className="p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
  );
} 