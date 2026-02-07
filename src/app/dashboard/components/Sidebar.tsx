"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { logout } from "@/utils/logout";

import {
  FaUserFriends,
  FaDatabase,
  FaClipboardList,
  FaBlog,
  FaLayerGroup,
  FaSignOutAlt,
  FaChevronDown,
  FaChevronRight,
  FaTags,
  FaQuestion,
} from "react-icons/fa";
import { GiGraduateCap } from "react-icons/gi";
import { MdDashboard, MdSettings } from "react-icons/md";

interface MenuItem {
  name: string;
  icon: JSX.Element;
  href?: string;
  subMenu?: { name: string; href: string }[];
}

interface SidebarProps {
  readonly isOpen: boolean;
}

export default function Sidebar({ isOpen }: Readonly<SidebarProps>) {
  const pathname = usePathname();
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // ===== MENU DEFINITION WITH URL ROUTES =====
  const menu: MenuItem[] = [
    { name: "Dashboard", icon: <MdDashboard />, href: "/dashboard" },

    {
      name: "Course Leads",
      icon: <FaUserFriends />,
      href: "/dashboard/CourseLeads",
    },

    {
      name: "Master Data",
      icon: <FaDatabase />,
      subMenu: [
        { name: "All Skills", href: "/dashboard/masterdata/allskills" },
        { name: "All Categories", href: "/dashboard/masterdata/allcategories" },
        // { name: "Popular Tags", href: "/dashboard/masterdata/populartags" },
      ],
    },

    {
      name: "All Pages",
      icon: <FaLayerGroup />,
      subMenu: [
        { name: "Home", href: "/dashboard/AllPages/Home" },
        { name: "Course Listing", href: "/dashboard/AllPages/CourseListing" },
        { name: "Blog Listing", href: "/dashboard/AllPages/BlogListing" },
        {
          name: "Corporate Training",
          href: "/dashboard/AllPages/CorporateTraining",
        },
        { name: "On Job Support", href: "/dashboard/AllPages/OnJobSupport" },
        {
          name: "Become An Instructor",
          href: "/dashboard/AllPages/BecomeAnInstructor",
        },
        { name: "About", href: "/dashboard/AllPages/About" },
        { name: "Contact", href: "/dashboard/AllPages/Contact" },
        {
          name: "Interview Questions",
          href: "/dashboard/AllPages/InterviewQuestions",
        },
        {
          name: "Legal Documents",
          href: "/dashboard/AllPages/LegalDocuments",
        },
      ],
    },

    {
      name: "Course Management",
      icon: <GiGraduateCap />,
      subMenu: [
        {
          name: "Add New Course",
          href: "/dashboard/CourseManagement/AddNewCourse",
        },
        { name: "All Courses", href: "/dashboard/CourseManagement/AllCourses" },
        { name: "Course FAQs", href: "/dashboard/CourseManagement/CourseFAQs" },
        // {
        //   name: "Course Reviews",
        //   href: "/dashboard/CourseManagement/CourseReviews",
        // },
      ],
    },

    {
      name: "Blog Management",
      icon: <FaBlog />,
      subMenu: [
        { name: "Add New Blog", href: "/dashboard/BlogManagement/AddNewBlog" },
        { name: "All Blogs", href: "/dashboard/BlogManagement/AllBlogs" },
      ],
    },


    {
      name: "IQs Management",
      icon: <FaQuestion />,
      subMenu: [
        { name: "Add New IQs", href: "/dashboard/IQsManagement/AddNewIQs" },
        { name: "All IQs", href: "/dashboard/IQsManagement/AllIQs" },
      ],
    },


    {
      name: "Common Section",
      icon: <FaClipboardList />,
      subMenu: [
        // { name: "Key Features", href: "/dashboard/CommonSection/KeyFeatures" },
        {
          name: "Job Assistance Program",
          href: "/dashboard/CommonSection/JobAssistanceProgram",
        },
        {
          name: "Placement and Reserve",
          href: "/dashboard/CommonSection/PlacementAndReserve",
        },
        // {
        //   name: "Live Free Demo",
        //   href: "/dashboard/CommonSection/LiveFreeDemo",
        // },
      ],
    },

    {
      name: "Instructor Applications",
      icon: <FaUserFriends />,
      href: "/dashboard/InstructorApplications",
    },

    {
      name: "SEO Management",
      icon: <FaTags />,
      href: "/dashboard/SEOManagement",
    },
    {
      name: "Settings",
      icon: <MdSettings />,
      subMenu: [
        {
          name: "Header Settings",
          href: "/dashboard/Settings/HeaderSettings",
        },
        {
          name: "Footer Settings",
          href: "/dashboard/Settings/FooterSettings",
        },
      ],
    },
  ];

  // Helper: Check if menu item is active
  const isMenuItemActive = (item: MenuItem): boolean => {
    if (item.href === pathname) return true;
    return item.subMenu?.some((s) => s.href === pathname) ?? false;
  };

  // Helper: Get menu item classes
  const getMenuItemClasses = (isActive: boolean): string => {
    const baseClasses =
      "w-full flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-all duration-200";
    if (isActive) {
      return `${baseClasses} bg-[#f3f4f6] shadow-sm scale-[1.01]`;
    }
    return `${baseClasses} hover:bg-[#f9fafb]`;
  };

  // Helper: Get menu item style
  const getMenuItemStyle = (isActive: boolean): { border: string } => {
    return {
      border: isActive
        ? "1px solid rgba(16,24,40,0.06)"
        : "1px solid transparent",
    };
  };

  // Helper: Get icon classes
  const getIconClasses = (isActive: boolean): string => {
    return `text-lg ${isActive ? "text-[#2C5CC5]" : "text-gray-700"}`;
  };

  // Helper: Get text classes
  const getTextClasses = (isActive: boolean): string => {
    return `font-medium ${isActive ? "text-[#2C5CC5]" : "text-gray-800"}`;
  };

  // Helper: Get submenu link classes
  const getSubmenuLinkClasses = (isSubActive: boolean): string => {
    const baseClasses = "block px-3 py-2 rounded-md text-sm transition-colors";
    if (isSubActive) {
      return `${baseClasses} text-[#2C5CC5] bg-[#f3f4f6] shadow-sm`;
    }
    return `${baseClasses} text-gray-600 hover:bg-[#f9fafb]`;
  };

  // ===== AUTO OPEN THE PARENT MENU BASED ON CURRENT URL =====
  useEffect(() => {
    menu.forEach((item) => {
      if (item.subMenu) {
        const isMatch = item.subMenu.some((sub) =>
          pathname.startsWith(sub.href)
        );
        if (isMatch) setOpenMenu(item.name);
      }
    });
  }, [pathname]);

  // Logout is now handled by Header component via Laravel logout endpoint
  // No need for token cleanup since we use HTTP-only cookies

  return (
    <aside
      className={`fixed top-0 left-0 h-full w-64 flex flex-col justify-between text-gray-900 transform transition-transform duration-300 z-40 overflow-hidden
      ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      style={{
        background:
          "linear-gradient(180deg,#fbfdff 0%, #f1f4f8 40%, #e9eef5 100%)",
        borderRight: "1px solid rgba(16,24,40,0.06)",
        borderTopRightRadius: "18px",
        borderBottomRightRadius: "18px",
      }}
    >
      {/* LOGO */}
      <div className="flex items-center justify-center px-4 py-3">
        <Link
          href="/dashboard"
          className="w-full max-w-[220px] px-3 py-2 bg-white shadow-sm rounded-xl flex items-center justify-center"
        >
          <img
            src="/default-uploads/Skill_Vedika_Transparent_Logo.png"
            alt="Skill Vedika"
            className="h-11 object-contain"
          />
        </Link>
      </div>

      {/* MENU */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 no-scrollbar">
        {menu.map((item) => {
          const isActive = isMenuItemActive(item);
          const itemClasses = getMenuItemClasses(isActive);
          const itemStyle = getMenuItemStyle(isActive);
          const iconClasses = getIconClasses(isActive);
          const textClasses = getTextClasses(isActive);

          return (
            <div key={item.name}>
              {/* MAIN ITEM */}
              {item.subMenu ? (
                <button
                  onClick={() => {
                    setOpenMenu(openMenu === item.name ? null : item.name);
                  }}
                  className={`${itemClasses} cursor-pointer`}
                  style={itemStyle}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className={iconClasses}>{item.icon}</span>
                    <span className={textClasses}>{item.name}</span>
                  </div>

                  {item.subMenu && (
                    <span className="text-xs text-gray-500">
                      {openMenu === item.name ? (
                        <FaChevronDown />
                      ) : (
                        <FaChevronRight />
                      )}
                    </span>
                  )}
                </button>
              ) : (
                <Link
                  href={item.href || "#"}
                  className={itemClasses}
                  style={itemStyle}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className={iconClasses}>{item.icon}</span>
                    <span className={textClasses}>{item.name}</span>
                  </div>
                </Link>
              )}

              {/* SUBMENUS */}
              {item.subMenu && openMenu === item.name && (
                <div className="ml-8 mt-2 space-y-1 pl-3 border-l border-gray-200/60">
                  {item.subMenu.map((sub) => {
                    const isSubActive = pathname === sub.href;
                    const subLinkClasses = getSubmenuLinkClasses(isSubActive);

                    return (
                      <Link
                        key={sub.name}
                        href={sub.href}
                        className={subLinkClasses}
                      >
                        {sub.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

     
      
      <button
        onClick={async () => {
          await logout(router);
        }}
        className="flex items-center gap-3 text-gray-700 hover:text-[#2C5CC5] w-full px-4 py-2 rounded-lg hover:bg-white/60 transition cursor-pointer"
      >
        <FaSignOutAlt /> Logout
      </button>
    </aside>
  );
}
