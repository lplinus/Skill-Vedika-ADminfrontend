"use client";

import React, { useState, useEffect } from "react";
import DashboardCard from "@/app/dashboard/components/DashboardCard";
import DashboardContent from "@/app/dashboard/components/DashboardContent";
import DashboardWrapper from "@/app/dashboard/components/DashboardWrapper";
// import axios from "@/utils/axios";
import {api} from "@/utils/axios";

import {
  FaGraduationCap,
  FaSlash,
  FaBlog,
  FaUserPlus,
  FaClipboardList,
} from "react-icons/fa";
import { LuGraduationCap } from "react-icons/lu";

interface DashboardStats {
  totalCourses: number;
  activeCourses: number;
  inactiveCourses: number;
  totalBlogs: number;
  totalLeads: number;
  totalCategories: number;
}

export default function Page() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    activeCourses: 0,
    inactiveCourses: 0,
    totalBlogs: 0,
    totalLeads: 0,
    totalCategories: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch courses
        const coursesRes = await api.get("/courses");
        const courses = Array.isArray(coursesRes.data)
          ? coursesRes.data
          : coursesRes.data?.data || [];
        const activeCourses = courses.filter(
          (c: { mode?: string }) => c.mode === "active"
        ).length;
        const inactiveCourses = courses.filter(
          (c: { mode?: string }) => c.mode === "inactive"
        ).length;

        // Fetch blogs
        const blogsRes = await api.get("/blogs");
        const blogs = Array.isArray(blogsRes.data)
          ? blogsRes.data
          : blogsRes.data?.data || [];

        // Fetch leads
        const leadsRes = await api.get("/leads");
        const leads = Array.isArray(leadsRes.data)
          ? leadsRes.data
          : leadsRes.data?.data || [];

        // Fetch categories
        const categoriesRes = await api.get("/categories");
        const categories = Array.isArray(categoriesRes.data)
          ? categoriesRes.data
          : categoriesRes.data?.data || [];

        setStats({
          totalCourses: courses.length,
          activeCourses,
          inactiveCourses,
          totalBlogs: blogs.length,
          totalLeads: leads.length,
          totalCategories: categories.length,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        // Keep default stats on error
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <DashboardWrapper title="Dashboard Overview">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <DashboardCard
          title="Total Courses"
          value={loading ? <div className="animate-pulse bg-gray-200 h-10 w-16 rounded"></div> : stats.totalCourses}
          icon={<FaGraduationCap className="text-[#2563EB] text-3xl" />}
        />

        <DashboardCard
          title="Courses Active"
          value={loading ? <div className="animate-pulse bg-gray-200 h-10 w-16 rounded"></div> : stats.activeCourses}
          icon={<LuGraduationCap className="text-[#16A34A] text-3xl" />}
        />

        <DashboardCard
          title="Courses Inactive"
          value={loading ? <div className="animate-pulse bg-gray-200 h-10 w-16 rounded"></div> : stats.inactiveCourses}
          icon={
            <div className="relative inline-block">
              <FaGraduationCap className="text-[#DC2626] text-3xl" />
              <FaSlash className="absolute top-0 left-0 text-[#DC2626] text-3xl rotate-12 opacity-70" />
            </div>
          }
        />

        <DashboardCard
          title="Total Blogs"
          value={loading ? <div className="animate-pulse bg-gray-200 h-10 w-16 rounded"></div> : stats.totalBlogs}
          icon={<FaBlog className="text-[#9333EA] text-3xl" />}
        />

        <DashboardCard
          title="Total Leads"
          value={loading ? <div className="animate-pulse bg-gray-200 h-10 w-16 rounded"></div> : stats.totalLeads}
          icon={<FaUserPlus className="text-[#F59E0B] text-3xl" />}
        />

        <DashboardCard
          title="Total Categories"
          value={loading ? <div className="animate-pulse bg-gray-200 h-10 w-16 rounded"></div> : stats.totalCategories}
          icon={<FaClipboardList className="text-[#0891B2] text-3xl" />}
        />
      </div>

      <DashboardContent stats={stats} loading={loading} />
    </DashboardWrapper>
  );
}
