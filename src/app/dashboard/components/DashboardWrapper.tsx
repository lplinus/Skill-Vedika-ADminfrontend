import React from "react";

interface DashboardWrapperProps {
  children: React.ReactNode;
  title?: string;
}

export default function DashboardWrapper({
  children,
  title,
}: DashboardWrapperProps) {
  return (
    <section
      className="rounded-3xl shadow-[0_6px_25px_rgba(0,0,0,0.05)] p-8 border border-gray-100 transition-all duration-300"
      //   style={{
      //     background: "linear-gradient(180deg, #f9fafc 0%, #f2f4f7 50%, #e9eef5 100%)",
      //   }}
    >
      {title && (
        <h2 className="text-2xl font-bold mb-6 text-gray-800 tracking-tight">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
