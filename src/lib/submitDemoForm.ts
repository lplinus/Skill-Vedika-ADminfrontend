export async function submitDemoForm(data: any) {
  // Submissions are opt-in. Make sure demos are enabled and API URL is provided.
  const enabled = process.env.NEXT_PUBLIC_DEMO_SUBMISSIONS_ENABLED === "true";
  if (!enabled) {
    throw new Error("Demo submissions are disabled. Set NEXT_PUBLIC_DEMO_SUBMISSIONS_ENABLED=true to enable.");
  }

  if (!process.env.NEXT_PUBLIC_API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not set. Cannot submit demo form.");
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => null);
      throw new Error(`Failed to submit demo form: ${response.status} ${response.statusText} ${text || ''}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Demo Form Submit Error:", error);
    throw error;
  }
}
