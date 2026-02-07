"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { FaSearch, FaEye, FaTimes } from "react-icons/fa";
import { api } from "@/utils/axios";

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  courses?: string[] | string;
  course_name?: string;
  status?: string;
  meta?: any;
  message?: string;
  admin_notes?: string;
  lead_source?: string;
  contacted_on?: string;
  created_at?: string;
}

interface DashboardStats {
  totalCourses: number;
  activeCourses: number;
  inactiveCourses: number;
  totalBlogs: number;
  totalLeads: number;
  totalCategories: number;
}

interface DashboardContentProps {
  readonly stats: DashboardStats;
  readonly loading: boolean;
}

export default function DashboardContent({
  stats,
  loading,
}: DashboardContentProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [mounted, setMounted] = useState(false);
  const [monthlyData, setMonthlyData] = useState<
    Array<{ month: string; leads: number }>
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchLeadsAndGenerateChart = async () => {
      try {
        setLeadsLoading(true);
 
        // Fetch leads
        const leadsRes = await api.get("/leads");
        const leadsData = Array.isArray(leadsRes.data)
          ? leadsRes.data
          : leadsRes.data?.data || [];

        // Process and normalize leads data
        const processedLeads: Lead[] = leadsData.map((lead: any): Lead => {
          // Parse courses if it's a JSON string
          let courses: string[] = [];
          if (lead.courses) {
            if (typeof lead.courses === 'string') {
              try {
                courses = JSON.parse(lead.courses);
              } catch {
                courses = [lead.courses];
              }
            } else if (Array.isArray(lead.courses)) {
              courses = lead.courses;
            }
          }

          return {
            ...lead,
            courses: courses,
          };
        });

        // Sort by ID descending (latest first) and take only the latest 10 leads
        const sortedLeads = processedLeads.sort((a: Lead, b: Lead) => {
          const aId = a.id || 0;
          const bId = b.id || 0;
          return bId - aId;
        });
        const latestLeads = sortedLeads.slice(0, 10);
        setLeads(latestLeads);

        // Generate monthly leads data from the leads' created_at dates
        const monthCounts: Record<string, number> = {};
        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];

        // Initialize all months to 0
        monthNames.forEach((month) => {
          monthCounts[month] = 0;
        });

        // Count leads by month
        leadsData.forEach((lead: Lead) => {
          if (lead.created_at) {
            const date = new Date(lead.created_at);
            const monthIndex = date.getMonth();
            const month = monthNames[monthIndex];
            monthCounts[month] = (monthCounts[month] || 0) + 1;
          }
        });

        // Normalize to 0-1 scale (max count / highest count)
        const counts = Object.values(monthCounts);
        const maxCount = Math.max(...counts, 1);
        const normalizedData = monthNames.map((month) => ({
          month,
          leads: Number.parseFloat((monthCounts[month] / maxCount).toFixed(2)),
        }));

        setMonthlyData(normalizedData);
      } catch (error) {
        console.error("Failed to fetch leads:", error);
      } finally {
        setLeadsLoading(false);
      }
    };

    fetchLeadsAndGenerateChart();
  }, []);

  // mark mounted on client to avoid rendering complex DOM-measuring
  // chart library during SSR / hydration which can cause warnings
  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredLeads = leads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(lead.courses) &&
        lead.courses.some((course) =>
          course.toLowerCase().includes(searchTerm.toLowerCase())
        )) ||
      (lead.course_name &&
        lead.course_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleViewDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLead(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-10">
      {/* ✅ Chart Section */}
      <section className="bg-white p-8 rounded-xl border border-gray-100">
        <h3 className="text-xl font-bold mb-6 text-gray-800">
          Monthly Leads (Normalized 0–1)
        </h3>

        <div style={{ width: "100%", height: 450, minWidth: 0, minHeight: 200 }}>
          {/* Render the chart only on the client to avoid Recharts measuring
              problems during SSR/hydration (width/height -1 warnings). */}
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
              >
              {/* ✅ Gradient fill */}
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1A3F66" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#1A3F66" stopOpacity={0.03} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="month"
                tick={{ fill: "#444", fontSize: 14, fontWeight: 500 }}
                axisLine={{ stroke: "#ccc" }}
              />
              <YAxis
                domain={[0, 1]}
                ticks={[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]}
                tickFormatter={(value) => value.toFixed(1)}
                tick={{ fill: "#444", fontSize: 13 }}
                axisLine={{ stroke: "#ccc" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
                cursor={{ stroke: "#1A3F66", strokeWidth: 1, opacity: 0.1 }}
              />

              {/* ✅ Clean, thin line with soft gradient fill */}
              <Area
                type="monotone"
                dataKey="leads"
                stroke="#1A3F66"
                strokeWidth={1.5} // thinner line
                fill="url(#colorLeads)"
                dot={{
                  r: 4,
                  stroke: "#1A3F66",
                  strokeWidth: 1.5,
                  fill: "#fff",
                }}
                activeDot={{
                  r: 6,
                  fill: "#1A3F66",
                  stroke: "#fff",
                  strokeWidth: 1.5,
                }}
              />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              Loading chart...
            </div>
          )}
        </div>
      </section>

      {/* ✅ Leads Table */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-800 tracking-tight mb-1">
            Latest 10 Course Leads
          </h3>
              <p className="text-sm text-gray-500">
                Recent course inquiries and student contacts
              </p>
            </div>

            <div className="relative w-full sm:w-80">
              <FaSearch className="absolute left-3.5 top-3.5 text-gray-400 text-sm pointer-events-none" />
            <input
              type="text"
                placeholder="Search by name, email, course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#1A3F66] focus:border-[#1A3F66] focus:outline-none transition-all duration-200 hover:border-gray-300"
            />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="py-2 px-3 font-semibold text-xs tracking-wide text-left text-gray-700 first:rounded-tl-xl">
                  ID
                </th>
                <th className="py-2 px-3 font-semibold text-xs tracking-wide text-left text-gray-700">
                  Name
                </th>
                <th className="py-2 px-3 font-semibold text-xs tracking-wide text-left text-gray-700">
                  Email
                </th>
                <th className="py-2 px-3 font-semibold text-xs tracking-wide text-left text-gray-700">
                  Phone
                </th>
                <th className="py-2 px-3 font-semibold text-xs tracking-wide text-left text-gray-700">
                  Course
                </th>
                <th className="py-2 px-3 font-semibold text-xs tracking-wide text-left text-gray-700">
                  Contacted On
                </th>
                <th className="py-2 px-3 font-semibold text-xs tracking-wide text-center text-gray-700 last:rounded-tr-xl">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-100">
              {leadsLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A3F66] mb-2"></div>
                      <span className="text-sm">Loading leads...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLeads.length > 0 ? (
                filteredLeads.map((lead, index) => (
                  <tr
                    key={lead.id}
                    className="text-xs text-gray-700 hover:bg-[#F1F4FB] transition-all duration-200 group"
                  >
                    <td className="py-2 px-3 font-medium text-gray-900">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-gray-700 font-semibold text-xs">
                        {lead.id}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-medium text-gray-900">
                      {lead.name}
                    </td>
                    <td className="py-2 px-3 text-gray-600">
                      <a
                        href={`mailto:${lead.email}`}
                        className="hover:text-[#1A3F66] transition-colors text-xs"
                      >
                        {lead.email}
                      </a>
                    </td>
                    <td className="py-2 px-3 text-gray-600 text-xs">
                      <a
                        href={`tel:${lead.phone}`}
                        className="hover:text-[#1A3F66] transition-colors"
                      >
                        {lead.phone}
                      </a>
                    </td>
                    <td className="py-2 px-3 max-w-[200px]">
                      {Array.isArray(lead.courses) && lead.courses.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {lead.courses.slice(0, 1).map((course) => {
                            const displayText =
                              course.length > 20
                                ? `${course.substring(0, 20)}...`
                                : course;
                            return (
                              <span
                                key={`${lead.id}-${course}`}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                                title={course}
                              >
                                {displayText}
                              </span>
                            );
                          })}
                          {lead.courses.length > 1 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                              +{lead.courses.length - 1}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-xs text-gray-600">
                      {(() => {
                        if (!lead.contacted_on && !lead.created_at) return "—";
                        try {
                          const date = new Date(lead.contacted_on || lead.created_at || "");
                          if (isNaN(date.getTime())) return "—";
                          return date.toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                        } catch {
                          return "—";
                        }
                      })()}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => handleViewDetails(lead)}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#F1F4FB] text-[#1A3F66] hover:bg-[#1A3F66] hover:text-white transition-all duration-200"
                        title="View Details"
                        aria-label="View lead details"
                      >
                        <FaEye className="text-xs" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center"
                  >
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <svg
                        className="w-12 h-12 mb-3 opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span className="text-sm font-medium">No matching records found</span>
                      <span className="text-xs mt-1">Try adjusting your search terms</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Lead Details Modal */}
      {isModalOpen && selectedLead && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") closeModal();
          }}
          tabIndex={-1}
          aria-label="Close modal"
        >
          <div
            className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-100 transform transition-all max-h-[90vh] flex flex-col"
            role="dialog"
            aria-labelledby="lead-modal-title"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") closeModal();
            }}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl flex justify-between items-start gap-3 z-10">
              <div>
                <h3
                  id="lead-modal-title"
                  className="text-xl font-bold text-gray-800 tracking-tight"
                >
                  Lead Details
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  ID #{selectedLead.id}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block">
                      Name
                    </span>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {selectedLead.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block">
                      Email
                    </span>
                    <p className="text-sm text-gray-700 mt-1">
                      <a
                        href={`mailto:${selectedLead.email}`}
                        className="text-[#1A3F66] hover:underline"
                      >
                        {selectedLead.email}
                      </a>
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block">
                      Phone
                    </span>
                    <p className="text-sm text-gray-700 mt-1">
                      <a
                        href={`tel:${selectedLead.phone}`}
                        className="text-[#1A3F66] hover:underline"
                      >
                        {selectedLead.phone}
                      </a>
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block">
                      Status
                    </span>
                    <p className="text-sm mt-1">
                      {(() => {
                        const status = selectedLead.status || "N/A";
                        const statusClass =
                          status === "New"
                            ? "bg-sky-100 text-sky-700"
                            : status === "Contacted"
                            ? "bg-amber-100 text-amber-700"
                            : status === "Closed"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-600";
                        return (
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${statusClass}`}
                          >
                            {status}
                          </span>
                        );
                      })()}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block">
                      Lead Source
                    </span>
                    <p className="text-sm text-gray-700 mt-1">
                      {selectedLead.lead_source || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block">
                      Contacted On
                    </span>
                    <p className="text-sm text-gray-700 mt-1">
                      {selectedLead.contacted_on
                        ? formatDate(selectedLead.contacted_on)
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block">
                      Created At
                    </span>
                    <p className="text-sm text-gray-700 mt-1">
                      {selectedLead.created_at
                        ? formatDate(selectedLead.created_at)
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Courses */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                  Courses{" "}
                  {Array.isArray(selectedLead.courses) &&
                    selectedLead.courses.length > 0 &&
                    `(${selectedLead.courses.length})`}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(selectedLead.courses) &&
                  selectedLead.courses.length > 0 ? (
                    selectedLead.courses.map((course) => (
                      <span
                        key={`${selectedLead.id}-${course}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200"
                      >
                        {course}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400 italic">
                      No courses specified
                    </span>
                  )}
                </div>
              </div>

              {/* Message */}
              {selectedLead.message && (
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                    Message
                  </h4>
                  <div
                    className="p-4 bg-white rounded-lg border-l-4 border-[#1A3F66] text-gray-800 leading-relaxed text-sm"
                    style={{ whiteSpace: "pre-line" }}
                  >
                    {selectedLead.message}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              {selectedLead.admin_notes && (
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                    Admin Notes
                  </h4>
                  <div
                    className="p-4 bg-white rounded-lg border-l-4 border-amber-400 text-gray-800 leading-relaxed text-sm"
                    style={{ whiteSpace: "pre-line" }}
                  >
                    {selectedLead.admin_notes}
                  </div>
                </div>
              )}

              {/* Meta Information */}
              {selectedLead.meta && (
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                    Additional Information
                  </h4>
                  <div className="p-4 bg-white rounded-lg text-gray-800 text-sm">
                    <pre className="whitespace-pre-wrap font-sans">
                      {typeof selectedLead.meta === "string"
                        ? selectedLead.meta
                        : JSON.stringify(selectedLead.meta, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-6 py-4 rounded-b-2xl flex justify-end">
              <button
                onClick={closeModal}
                className="px-6 py-2.5 bg-[#1A3F66] text-white rounded-lg font-medium hover:bg-[#153354] transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
