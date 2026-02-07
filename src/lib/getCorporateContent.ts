// lib/getCorporateContent.ts
export async function getCorporateContent() {
  const api = process.env.NEXT_PUBLIC_API_URL;
  if (!api) {
    console.error('Missing NEXT_PUBLIC_API_URL');
    return null;
  }

  try {
    const res = await fetch(`${api}/corporate-training`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json;
  } catch (err) {
    console.error('Corporate content fetch error:', err);
    return null;
  }
}
