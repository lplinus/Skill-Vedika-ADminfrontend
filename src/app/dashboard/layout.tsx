"use client";

import { useState } from "react";
import { Toaster } from "react-hot-toast";
import Sidebar from "@/app/dashboard/components/Sidebar";
import Header from "@/app/dashboard/components/Header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleToggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex min-h-screen bg-[#f9fafb] overflow-hidden">
      <Toaster position="top-right" />

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} />

      {/* Content */}
      <div
        className={`flex flex-col flex-1 transition-all duration-300 ${
          isSidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        <Header
          onToggleSidebar={handleToggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />

        <main className="flex-1 p-6 mt-16 overflow-y-auto bg-[#f9fafb] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="min-h-[80vh] space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
