import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect logged-in users to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <span className="font-bold text-lg">Lab Queue System</span>
          <Button asChild>
            <Link href="/auth/signin">Sign In</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="container py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Computer Lab
            <br />
            <span className="text-primary">Booking System</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Reserve computers for your training sessions. Book for any duration,
            join the queue when busy, and release unused time for others.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/auth/signin">Get Started</Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-muted/50 py-16">
          <div className="container">
            <h2 className="text-center text-2xl font-bold mb-8">Features</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Flexible Booking</CardTitle>
                  <CardDescription>
                    Book a computer for any duration — hours, days, or weeks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    No time limits. Reserve a workstation for as long as your
                    training project requires.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Smart Queue</CardTitle>
                  <CardDescription>
                    Join the queue and get notified when a computer is available
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Real-time updates on your queue position. Never miss an
                    available slot.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Early Release</CardTitle>
                  <CardDescription>
                    Finished early? Release the remaining time for others
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Help your peers by freeing unused time. The system
                    automatically notifies waiting users.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          Lab Queue System — UGM TRPL
        </div>
      </footer>
    </div>
  );
}
