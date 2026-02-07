import { api } from "@/utils/axios";

export async function logout(router: any) {
  try {
    localStorage.removeItem("admin_avatar");
  } catch {}

  try {
    // Laravel session + cookie logout
    await api.post("/admin/logout");
  } catch (err) {
    // Even if backend fails, continue logout
    console.error("Logout API error", err);
  }

  router.push("/");
}
