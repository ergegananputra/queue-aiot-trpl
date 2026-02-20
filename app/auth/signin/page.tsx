"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);

  const allowedDomainsEnv = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || "mail.ugm.ac.id";
  const allowedDomains = allowedDomainsEnv.split(",").map((d) => d.trim().toLowerCase());
  const primaryDomain = allowedDomains[0];

  const isEmailDomainAllowed = (email: string) => {
    const emailDomain = email.toLowerCase().split("@")[1];
    return emailDomain && allowedDomains.includes(emailDomain);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setRetryAfter(0);

    // Keep client-side check for UX, but server validates too
    if (!isEmailDomainAllowed(email)) {
      const domainList = allowedDomains.map((d) => `@${d}`).join(", ");
      setError(`Only ${domainList} emails are allowed`);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429 && data.retryAfter) {
          setRetryAfter(data.retryAfter);
        }
        setError(data.error || "Failed to send magic link");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Failed to send magic link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>
              A sign-in link has been sent to {email}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-6xl">📧</div>
            <p className="text-muted-foreground">
              Click the link in the email to sign in to the TRPL AIoT Lab Queue System.
            </p>
            <Button variant="outline" onClick={() => setSuccess(false)}>
              Use a different email
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">TRPL AIoT Lab Queue System</CardTitle>
          <CardDescription>
            Sign in with your UGM email to access the computer lab booking system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder={`yourname@${primaryDomain}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="space-y-1">
                <p className="text-sm text-destructive">{error}</p>
                {retryAfter > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Rate limit: {retryAfter}s remaining
                  </p>
                )}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Magic Link"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              We&apos;ll send you a magic link to sign in. No password required.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
