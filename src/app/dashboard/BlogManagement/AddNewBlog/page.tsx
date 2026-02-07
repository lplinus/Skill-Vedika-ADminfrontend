"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import TipTapEditor from "@/app/dashboard/AllPages/CorporateTraining/components/TipTapEditor";
import {
  AdminCard,
  AdminInput,
  AdminTextarea,
  BannerBox,
} from "@/app/dashboard/AllPages/CorporateTraining/components/AdminUI";

import { api } from "@/utils/axios";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";
import { uploadToCloudinary } from "@/services/cloudinaryUpload";

interface BlogData {
  blog_name: string;
  category_id: number | null;
  banner_image: string;
  thumbnail_image: string;
  short_description: string;
  blog_content: string;
  published_by: string;
  published_at: string | null;
  status: string;
  recent_blog: string;
  is_trending: string;// newly added
  url_friendly_title: string;// newly added
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
}

interface BlogCategory {
  id: number;
  name: string;
}

function toDatetimeLocal(dateString?: string | null): string {
  if (!dateString) return '';

  const date = new Date(dateString);

  // Handle invalid date
  if (isNaN(date.getTime())) return '';

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    date.getFullYear() +
    '-' +
    pad(date.getMonth() + 1) +
    '-' +
    pad(date.getDate()) +
    'T' +
    pad(date.getHours()) +
    ':' +
    pad(date.getMinutes())
  );
}


function AddNewBlogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const blogId = searchParams.get("blogId");
  const isEditMode = !!blogId;

  /* -------------------- STATES -------------------- */
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [blogTitle, setBlogTitle] = useState("");
  const [shortContent, setShortContent] = useState("");
  const [fullContent, setFullContent] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [thumbnailImage, setThumbnailImage] = useState("");
  const [publishedBy, setPublishedBy] = useState("");
  const [publishedAt, setPublishedAt] = useState("");
  const [status, setStatus] = useState("draft");
  const [recentBlog, setRecentBlog] = useState("NO");
  const [isTrending, setIsTrending] = useState("no");// newly added
  const [urlFriendlyTitle, setUrlFriendlyTitle] = useState("");// newly added
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);

  const clean = (v: string) => {
    if (!v) return null;
    const t = v.trim();
    return t !== "" ? t : null;
  };


  /* -------------------- FETCH CATEGORIES -------------------- */
  /* -------------------- FETCH CATEGORIES -------------------- */
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get("/blog-categories");

        const normalized: BlogCategory[] = res.data.map((c: any) => ({
          id: c.id,
          name: c.name,
        }));

        setCategories(normalized);
      } catch (err) {
        console.error("Failed to load blog categories:", err);
        toast.error("Failed to load blog categories");
      }
    };

    loadCategories();
  }, []);

  /* -------------------- FETCH BLOG DATA (EDIT MODE) -------------------- */
  const fetchBlogData = useCallback(async () => {
    if (!blogId) return;
    try {
      setLoading(true);
      const res = await api.get(`/blogs/${blogId}`);
      const blog = res.data as BlogData & { blog_id?: number };

      // Pre-populate form with blog data
      setMetaTitle(blog.meta_title || "");
      setMetaDescription(blog.meta_description || "");
      setMetaKeywords(blog.meta_keywords || "");
      setCategoryId(String(blog.category_id || ""));
      setBlogTitle(blog.blog_name || "");
      setShortContent(blog.short_description || "");
      setFullContent(blog.blog_content || "");
      setBannerImage(blog.banner_image || "");
      setThumbnailImage(blog.thumbnail_image || "");
      setPublishedBy(blog.published_by || "");
      setPublishedAt(toDatetimeLocal(blog.published_at));
      setStatus(blog.status || "draft");
      setRecentBlog(blog.recent_blog || "NO");
      setIsTrending(blog.is_trending || "no");// newly added
      setUrlFriendlyTitle(blog.url_friendly_title || "");
    } catch (error) {
      console.error("Failed to load blog data:", error);
      toast.error("Failed to load blog data");
    } finally {
      setLoading(false);
    }
  }, [blogId]);

  useEffect(() => {
    if (isEditMode) {
      void fetchBlogData();
    }
  }, [isEditMode, fetchBlogData]);

  /* -------------------- RESET FORM -------------------- */
  const resetForm = () => {
    setBlogTitle("");
    setFullContent("");
    setShortContent("");
    setBannerImage("");
    setThumbnailImage("");
    setPublishedBy("");
    setPublishedAt("");
    setStatus("draft");
    setRecentBlog("NO");
    setIsTrending("no");// newly added
    setUrlFriendlyTitle("");// newly added
    setCategoryId("");
    setMetaTitle("");
    setMetaDescription("");
    setMetaKeywords("");
  };

  const isValidUploadCandidate = (value: string) => {
    if (!value) return false;
    if (value === "/placeholder.png") return false;
    if (value.startsWith("http://") || value.startsWith("https://")) return false;
    if (value.startsWith("data:image/")) return true;
    return false;
  };


  /* -------------------- SUBMIT HANDLER -------------------- */
  const handleSubmit = async () => {
    // Validate required fields
    if (!blogTitle.trim()) {
      toast.error("Blog title is required!");
      return;
    }
    if (!fullContent.trim()) {
      toast.error("Blog content is required!");
      return;
    }

    try {
      setSubmitting(true);

      let bannerUrl = bannerImage;
      let thumbnailUrl = thumbnailImage;

      // Upload banner image if it's a new file (base64 or file path)
      if (isValidUploadCandidate(bannerImage)) {
        const file = await fetch(bannerImage).then((r) => r.blob());

        if (!file.type.startsWith("image/")) {
          throw new Error("Invalid banner image file");
        }

        const result = await uploadToCloudinary(
          new File([file], "banner.jpg", { type: file.type })
        );
        bannerUrl = result.secure_url;
      }


      // Upload thumbnail image if it's a new file
      if (isValidUploadCandidate(thumbnailImage)) {
        const file = await fetch(thumbnailImage).then((r) => r.blob());

        if (!file.type.startsWith("image/")) {
          throw new Error("Invalid thumbnail image file");
        }

        const result = await uploadToCloudinary(
          new File([file], "thumbnail.jpg", { type: file.type })
        );
        thumbnailUrl = result.secure_url;
      }


      const payload = {
        blog_name: blogTitle,
        category_id: categoryId ? Number(categoryId) : null,
        banner_image: clean(bannerUrl),
        thumbnail_image: clean(thumbnailUrl),
        short_description: shortContent,
        blog_content: fullContent,
        published_by: clean(publishedBy),
        published_at: publishedAt || null,
        status,
        recent_blog: recentBlog,
        is_trending: isTrending,// newly added
        url_friendly_title: clean(urlFriendlyTitle),
        meta_title: clean(metaTitle),
        meta_description: clean(metaDescription),
        meta_keywords: clean(metaKeywords),
      };


      if (blogId) {
        // ✅ ALWAYS UPDATE if blogId exists
        await api.put(`/blogs/${blogId}`, payload);
        toast.success("Blog updated successfully!");
      } else {
        await api.post("/blogs", payload);
        toast.success("Blog created successfully!");
      }

      // Redirect to AllBlogs after success
      router.push("/dashboard/BlogManagement/AllBlogs");
    } catch (error: unknown) {
      console.error("blog operation error:", error);
      let serverMessage = isEditMode
        ? "Failed to update blog!"
        : "Failed to create blog!";
      try {
        if (isAxiosError(error)) {
          const resp = error.response;
          const respData = (resp && resp.data) as
            | {
              message?: string;
              error?: string;
              errors?: Record<string, string[]>;
            }
            | undefined;
          if (resp?.status === 401) {
            serverMessage =
              "Unauthenticated. Please login as admin to manage blogs.";
          } else if (resp?.status === 422 && respData?.errors) {
            const errors = Object.values(respData.errors).flat();
            serverMessage = errors.join(" ");
          } else {
            serverMessage =
              respData?.message ||
              respData?.error ||
              (error as Error).message ||
              serverMessage;
          }
        } else if (error instanceof Error) {
          serverMessage = error.message || serverMessage;
        }
      } catch {
        // fallback
      }
      toast.error(serverMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-600">Loading blog data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-2xl font-bold text-gray-800">
        {isEditMode ? "Edit Blog" : "Add New Blog"}
      </h1>

      {/* ----------------------------------------------------------- */}
      {/* BLOG META DATA */}
      {/* ----------------------------------------------------------- */}
      <AdminCard title="Blog MetaData">
        <AdminInput
          label="Meta Title"
          value={metaTitle}
          onChange={setMetaTitle}
        />

        <AdminTextarea
          label="Meta Description"
          value={metaDescription}
          onChange={setMetaDescription}
          rows={3}
        />

        <AdminInput
          label="Meta Keywords"
          value={metaKeywords}
          onChange={setMetaKeywords}
        />
         <AdminInput
          label="Slug"                     //newly added
          value={urlFriendlyTitle}
          onChange={setUrlFriendlyTitle}
        />

        <p className="text-xs text-gray-500 -mt-2 mb-4">
          URL Preview: /blog/{urlFriendlyTitle || 'auto-generated-by-system'}
        </p>

        {/* Category Dropdown */}
        <div>
          <label className="text-gray-600 font-semibold mb-1 block">
            Blog Category
          </label>
          <select
            className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={String(cat.id)}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </AdminCard>

      {/* ----------------------------------------------------------- */}
      {/* BLOG DETAILS */}
      {/* ----------------------------------------------------------- */}
      <AdminCard title="Blog Details">
        <AdminInput
          label="Blog Title"
          value={blogTitle}
          onChange={setBlogTitle}
        />
      
        <AdminTextarea
          label="Blog Short Content"
          value={shortContent}
          onChange={setShortContent}
          rows={3}
        />

        {/* Full Content Editor */}
        <div>
          <label className="text-gray-600 font-semibold mb-1 block">
            Blog Full Content
          </label>
          <TipTapEditor value={fullContent} onChange={setFullContent} />
        </div>

        {/* IMAGES */}
        <BannerBox
          label="Banner Image"
          image={bannerImage}
          onUpload={setBannerImage}
        />

        <BannerBox
          label="Thumbnail Image"
          image={thumbnailImage}
          onUpload={setThumbnailImage}
        />
      </AdminCard>

      {/* ----------------------------------------------------------- */}
      {/* ADDITIONAL FIELDS */}
      {/* ----------------------------------------------------------- */}
      <AdminCard title="Additional Settings">
        <AdminInput
          label="Published By"
          value={publishedBy}
          onChange={setPublishedBy}
        />

        <div>
          <label className="text-gray-600 font-semibold mb-1 block">
            Published At
          </label>
          <input
            type="datetime-local"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300"
          />
        </div>

        {/* Status */}
        <div>
          <label className="text-gray-600 font-semibold mb-1 block">
            Status
          </label>
          <select
            className="w-full px-4 py-2 rounded-lg border border-gray-300"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Recent Blog Flag */}
        <div>
          <label className="text-gray-600 font-semibold mb-1 block">
            Recent Blog
          </label>
          <select
            className="w-full px-4 py-2 rounded-lg border border-gray-300"
            value={recentBlog}
            onChange={(e) => setRecentBlog(e.target.value)}
          >
            <option value="NO">NO</option>
            <option value="YES">YES</option>
          </select>
        </div>

        {/* Is Trending Flag */}
        <div>
          <label className="text-gray-600 font-semibold mb-1 block">
            Is Trending
          </label>
          <select
            className="w-full px-4 py-2 rounded-lg border border-gray-300"
            value={isTrending}
            onChange={(e) => setIsTrending(e.target.value)}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
      </AdminCard>

      {/* ----------------------------------------------------------- */}
      {/* SUBMIT BUTTON */}
      {/* ----------------------------------------------------------- */}
      <div className="flex gap-4">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-6 py-3 bg-[#1A3F66] hover:bg-blue-800 text-white rounded-lg transition disabled:bg-gray-400"
        >
          {submitting ? "Saving..." : isEditMode ? "Update Blog" : "Create Blog"}
        </button>
        <button
          onClick={() => router.push("/dashboard/BlogManagement/AllBlogs")}
          className="px-6 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function AddNewBlogPage() {
  return (
    <Suspense fallback={
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <AddNewBlogContent />
    </Suspense>
  );
}
