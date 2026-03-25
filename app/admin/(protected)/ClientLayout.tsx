'use client'

import AdminHeader from "@/app/admin/components/AdminHeader";
import Sidebar from "@/app/admin/components/Sidebar";
import React, { ReactNode, useState } from "react";

const ClientLayout = ({ children }: { children: ReactNode }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/** Main Content  */}
      <div className="flex-1 lg:ml-64 flex flex-col">
        <AdminHeader onMenuClick={() => setIsMobileSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

export default ClientLayout;
