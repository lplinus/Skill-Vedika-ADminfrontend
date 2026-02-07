"use client";

import React from "react";

interface DashboardCardProps {
  title: string;
  value: string | number | React.ReactNode;
  icon: JSX.Element;
}

export default function DashboardCard({
  title,
  value,
  icon,
}: DashboardCardProps) {
  return (
    <div
      className="
        bg-white
        rounded-2xl
        shadow-sm
        hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)]
        transition-all
        duration-300
        p-6
        flex
        justify-between
        items-center
        border border-gray-100
      "
    >
      <div>
        <h3 className="text-base font-semibold text-gray-800 tracking-wide">
          {title}
        </h3>
        <div className="text-4xl font-bold mt-2 text-gray-900 leading-tight">
          {value}
        </div>
      </div>
      <div className="flex items-center justify-center bg-[#F1F4FB] p-3 rounded-xl">
        {icon}
      </div>
    </div>
  );
}
