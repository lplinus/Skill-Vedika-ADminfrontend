// "use client";

// import { useState, useEffect, useCallback, useMemo } from "react";
// import { useRouter } from "next/navigation";
// import { FaEdit, FaTrash } from "react-icons/fa";
// import { api } from "@/utils/axios";
// import toast from "react-hot-toast";

// /* ================= TYPES ================= */
// interface Blog {
//   blog_id: number;
//   blog_name: string;
//   banner_image: any;
//   status: string;
//   recent_blog: "YES" | "NO";
//   is_trending: "yes" | "no";//newly added
//   created_at: string | null;
//   updated_at: string | null;
// }

// /* ================= STABLE IMAGE COMPONENT ================= */
// const StableImage = ({
//   src,
//   alt,
// }: {
//   src: string;
//   alt: string;
// }) => {
//   const [imgSrc, setImgSrc] = useState(src);

//   useEffect(() => {
//     setImgSrc(src);
//   }, [src]);

//   return (
//     <img
//       src={imgSrc}
//       alt={alt}
//       loading="lazy"
//       className="w-32 h-20 object-cover rounded-lg shadow-sm"
//       onError={() => setImgSrc("/placeholder.png")}
//     />
//   );
// };

// /* ================= MAIN TABLE ================= */
// function AllBlogsTable() {
//   const router = useRouter();
//   const [search, setSearch] = useState("");
//   const [blogs, setBlogs] = useState<Blog[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

//   /* ================= FETCH BLOGS ================= */
//   const fetchBlogs = useCallback(async () => {
//     try {
//       setLoading(true);
//       const res = await api.get("/blogs");
//       setBlogs(Array.isArray(res.data) ? res.data : []);
//     } catch {
//       toast.error("Failed to load blogs");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchBlogs();
//   }, [fetchBlogs]);

//   /* ================= IMAGE RESOLVER ================= */
//   const resolveImageUrl = (image: any) => {
//     if (!image) return "/placeholder.png";
//     if (typeof image === "string") {
//       if (image.startsWith("http")) return image;
//       if (image.startsWith("/")) return image;
//       return `/storage/${image}`;
//     }
//     return image?.secure_url || "/placeholder.png";
//   };

//   /* ================= FILTER ================= */
//   const filteredBlogs = useMemo(() => {
//     const q = search.toLowerCase();
//     return blogs.filter(
//       (b) =>
//         b.blog_name.toLowerCase().includes(q) ||
//         b.blog_id.toString().includes(q)
//     );
//   }, [blogs, search]);

//   const getStatusColor = (status: string) => {
//     switch (status?.toLowerCase()) {
//       case "published":
//         return "bg-green-200 text-green-700";
//       case "draft":
//         return "bg-yellow-200 text-yellow-700";
//       default:
//         return "bg-gray-200 text-gray-700";
//     }
//   };

//   return (
//     <div className="p-8 bg-white rounded-3xl shadow-md border border-gray-200">
//       {/* HEADER */}
//       <div className="flex justify-between items-center mb-8">
//         <h1 className="text-3xl font-bold text-gray-900">All Blogs</h1>

//         <div className="flex items-center gap-4">
//           <button
//             onClick={() =>
//               router.push("/dashboard/BlogManagement/AddNewBlog")
//             }
//             className="bg-[#1A3F66] hover:bg-blue-800 text-white px-6 py-2.5 rounded-xl shadow-sm transition"
//           >
//             Add New Blog
//           </button>

//           <input
//             type="text"
//             placeholder="Search blogs..."
//             className="px-4 py-2 border border-gray-300 rounded-xl w-64"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />
//         </div>
//       </div>

//       {loading && (
//         <div className="py-8 text-center text-gray-500">
//           Loading blogs...
//         </div>
//       )}

//       {!loading && (
//         <div className="overflow-x-auto rounded-2xl">
//           <table className="w-full text-left">
//             <thead className="bg-gray-100">
//               <tr>
//                 <th className="py-4 px-6">ID</th>
//                 <th className="py-4 px-6">Blog Title</th>
//                 <th className="py-4 px-6 text-center">Banner Image</th>
//                 <th className="py-4 px-6 text-center">Recent</th>
//                 <th className="py-4 px-6 text-center">Trending</th>     
//                 <th className="py-4 px-6">Status</th>
//                 <th className="py-4 px-6 text-right">Actions</th>
//               </tr>
//             </thead>

//             <tbody>
//               {filteredBlogs.map((blog) => (
//                 <tr key={blog.blog_id} className="border-b border-gray-200">
//                   <td className="py-4 px-6">{blog.blog_id}</td>
//                   <td className="py-4 px-6">{blog.blog_name}</td>

//                   <td className="py-4 px-6 text-center">
//                     <StableImage
//                       src={resolveImageUrl(blog.banner_image)}
//                       alt={blog.blog_name}
//                     />
//                   </td>

//                   {/* ✅ RECENT COLUMN */}
//                   <td className="py-4 px-6 text-center">
//                     <span
//                       className={`px-3 py-1 rounded-full text-xs ${blog.recent_blog === "YES"
//                           ? "bg-blue-100 text-blue-700"
//                           : "bg-gray-200 text-gray-700"
//                         }`}
//                     >
//                       {blog.recent_blog}
//                     </span>
//                   </td>

//                   {/* newly added  is_trending*/}
//                   <td className="py-4 px-6 text-center">
//                     <span
//                       className={`px-3 py-1 rounded-full text-xs ${blog.is_trending === "yes"
//                           ? "bg-blue-100 text-blue-700"
//                           : "bg-gray-200 text-gray-700"
//                         }`}
//                     >
//                       {blog.is_trending}
//                     </span>
//                   </td>

//                   <td className="py-4 px-6">
//                     <span
//                       className={`${getStatusColor(
//                         blog.status
//                       )} px-4 py-1 rounded-full text-sm`}
//                     >
//                       {blog.status}
//                     </span>
//                   </td>

//                   <td className="py-4 px-6 text-right">
//                     <div className="flex justify-end gap-4">
//                       <button
//                         onClick={() =>
//                           router.push(
//                             `/dashboard/BlogManagement/AddNewBlog?blogId=${blog.blog_id}`
//                           )
//                         }
//                         className="text-yellow-600 bg-[#FFF6C4] p-2 rounded-xl"
//                       >
//                         <FaEdit size={18} />
//                       </button>
//                       <button
//                         onClick={() => setShowDeleteConfirm(blog.blog_id)}
//                         className="text-red-600 bg-[#FFE3E3] p-2 rounded-xl"
//                       >
//                         <FaTrash size={18} />
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}

//               {filteredBlogs.length === 0 && (
//                 <tr>
//                   <td
//                     colSpan={6}
//                     className="py-8 text-center text-gray-500 italic"
//                   >
//                     No blogs found.
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }

// /* ✅ REQUIRED DEFAULT EXPORT */
// export default function AllBlogsPage() {
//   return <AllBlogsTable />;
// }


"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FaEdit, FaTrash } from "react-icons/fa";
import { api } from "@/utils/axios";
import toast from "react-hot-toast";

/* ================= TYPES ================= */
interface Blog {
  blog_id: number;
  blog_name: string;
  banner_image: any;
  status: string;
  recent_blog: "YES" | "NO";
  is_trending: "yes" | "no";
  url_friendly_title: string;// newly added
  created_at: string | null;
  updated_at: string | null;
}

/* ================= STABLE IMAGE COMPONENT ================= */
const StableImage = ({ src, alt }: { src: string; alt: string }) => {
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <img
      src={imgSrc}
      alt={alt}
      loading="lazy"
      className="w-32 h-20 object-cover rounded-lg shadow-sm"
      onError={() => setImgSrc("/placeholder.png")}
    />
  );
};

/* ================= MAIN TABLE ================= */
function AllBlogsTable() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  /* ================= FETCH BLOGS ================= */
  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/blogs");
      setBlogs(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to load blogs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  /* ================= DELETE ACTION ================= */
  const handleDelete = async (blogId: number) => {
    try {
      await api.delete(`/blogs/${blogId}`);
      toast.success("Blog deleted successfully!");
      setShowDeleteConfirm(null);
      fetchBlogs(); // Refresh list
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to delete blog";
      toast.error(msg);
    }
  };

  /* ================= IMAGE RESOLVER ================= */
  const resolveImageUrl = (image: any) => {
    if (!image) return "/placeholder.png";
    if (typeof image === "string") {
      if (image.startsWith("http")) return image;
      if (image.startsWith("/")) return image;
      return `/storage/${image}`;
    }
    return image?.secure_url || "/placeholder.png";
  };

  /* ================= FILTER ================= */
  const filteredBlogs = useMemo(() => {
    const q = search.toLowerCase();
    return blogs.filter(
      (b) =>
        b.blog_name.toLowerCase().includes(q) ||
        b.blog_id.toString().includes(q)
    );
  }, [blogs, search]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "published":
        return "bg-green-200 text-green-700";
      case "draft":
        return "bg-yellow-200 text-yellow-700";
      default:
        return "bg-gray-200 text-gray-700";
    }
  };

  return (
    <div className="p-8 bg-white rounded-3xl shadow-md border border-gray-200">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">All Blogs</h1>

        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard/BlogManagement/AddNewBlog")}
            className="bg-[#1A3F66] hover:bg-blue-800 text-white px-6 py-2.5 rounded-xl shadow-sm transition"
          >
            Add New Blog
          </button>

          <input
            type="text"
            placeholder="Search blogs..."
            className="px-4 py-2 border border-gray-300 rounded-xl w-64 focus:ring focus:ring-blue-100 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading && (
        <div className="py-8 text-center text-gray-500">Loading blogs...</div>
      )}

      {!loading && (
        <div className="overflow-x-auto rounded-2xl">
          <table className="w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">Blog Title</th>
                <th className="py-4 px-6 text-center">Banner Image</th>
                <th className="py-4 px-6 text-center">Recent</th>
                <th className="py-4 px-6 text-center">Trending</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredBlogs.map((blog) => (
                <tr key={blog.blog_id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                  <td className="py-4 px-6">{blog.blog_id}</td>
                  <td className="py-4 px-6 font-medium">{blog.blog_name}</td>

                  <td className="py-4 px-6 text-center">
                    <StableImage
                      src={resolveImageUrl(blog.banner_image)}
                      alt={blog.blog_name}
                    />
                  </td>

                  <td className="py-4 px-6 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        blog.recent_blog === "YES"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {blog.recent_blog}
                    </span>
                  </td>

                  <td className="py-4 px-6 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        blog.is_trending === "yes"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {blog.is_trending?.toUpperCase()}
                    </span>
                  </td>

                  <td className="py-4 px-6">
                    <span
                      className={`${getStatusColor(
                        blog.status
                      )} px-4 py-1 rounded-full text-sm font-medium`}
                    >
                      {blog.status}
                    </span>
                  </td>

                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-4">
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/BlogManagement/AddNewBlog?blogId=${blog.blog_id}`
                          )
                        }
                        className="text-yellow-600 bg-[#FFF6C4] p-2 rounded-xl hover:bg-yellow-200 transition"
                      >
                        <FaEdit size={18} />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(blog.blog_id)}
                        className="text-red-600 bg-[#FFE3E3] p-2 rounded-xl hover:bg-red-200 transition"
                      >
                        <FaTrash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredBlogs.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-gray-500 italic"
                  >
                    No blogs found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {showDeleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full">
            <h2 className="text-2xl font-bold mb-3 text-gray-900">Confirm Delete</h2>
            <p className="text-gray-600 mb-8">
              Are you sure you want to permanently delete this blog? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-3 rounded-2xl transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-2xl transition font-semibold shadow-lg shadow-red-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AllBlogsPage() {
  return <AllBlogsTable />;
}