import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// In-memory rate limiter (use Redis in production for multi-instance deployments)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 3; // Max 3 OTP requests per minute
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // Cleanup old entries every 5 minutes

// Cleanup old rate limit entries periodically
let lastCleanup = Date.now();
function cleanupRateLimitMap() {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetAt) {
        rateLimitMap.delete(key);
      }
    }
    lastCleanup = now;
  }
}

function getRateLimitKey(ip: string, email: string): string {
  // Rate limit by both IP and email to prevent abuse
  return `${ip}:${email.toLowerCase()}`;
}

function checkRateLimit(key: string): { allowed: boolean; retryAfter: number } {
  cleanupRateLimitMap();
  
  const now = Date.now();
  const existing = rateLimitMap.get(key);
  
  if (!existing || now > existing.resetAt) {
    // Start new window
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }
  
  if (existing.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  // Increment count
  existing.count++;
  return { allowed: true, retryAfter: 0 };
}

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const forwarded = headersList.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || 
               headersList.get("x-real-ip") || 
               "unknown";
    
    const body = await request.json();
    const { email } = body;
    
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Server-side email domain validation (supports multiple domains, comma-separated)
    const allowedDomainsEnv = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || "mail.ugm.ac.id";
    const allowedDomains = allowedDomainsEnv.split(",").map((d) => d.trim().toLowerCase());
    const emailDomain = normalizedEmail.split("@")[1];
    
    if (!emailDomain || !allowedDomains.includes(emailDomain)) {
      const domainList = allowedDomains.map((d) => `@${d}`).join(", ");
      return NextResponse.json(
        { error: `Only ${domainList} emails are allowed` },
        { status: 403 }
      );
    }
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }
    
    // Check rate limit
    const rateLimitKey = getRateLimitKey(ip, normalizedEmail);
    const { allowed, retryAfter } = checkRateLimit(rateLimitKey);
    
    if (!allowed) {
      return NextResponse.json(
        { 
          error: `Too many requests. Please wait ${retryAfter} seconds before trying again.`,
          retryAfter 
        },
        { 
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
          }
        }
      );
    }
    
    // Send OTP via Supabase
    const supabase = await createClient();
    const origin = request.headers.get("origin") || "";
    
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });
    
    if (signInError) {
      console.error("Supabase OTP error:", signInError.message);
      return NextResponse.json(
        { error: "Failed to send magic link. Please try again." },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: "Magic link sent successfully" 
    });
    
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
