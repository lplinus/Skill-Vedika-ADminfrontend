/**
 * Type-only route for /api/auth/login
 * 
 * ⚠️ IMPORTANT: This route file exists ONLY to satisfy Next.js TypeScript
 * type validation during build. It is NOT used by the actual application.
 * 
 * The actual login functionality uses:
 * - Path: /api/admin/login (via api.post("/admin/login", ...))
 * - Handled by: Laravel backend through Next.js rewrites
 * - Location: src/app/page.tsx (handleLogin function)
 * 
 * This file can be safely ignored - it's purely for build-time type checking.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    const baseUrl = backendUrl.replace(/\/api\/?$/, '');
    
    // Get cookies from the request
    const cookies = request.headers.get('cookie') || '';
    
    // Forward request to Laravel backend
    const response = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(cookies ? { Cookie: cookies } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[login route] Error:', error);
    return NextResponse.json(
      { message: 'Login failed' },
      { status: 500 }
    );
  }
}

