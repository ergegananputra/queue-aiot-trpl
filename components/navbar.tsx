"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface NavbarProps {
  notificationCount?: number;
}

export function Navbar({ notificationCount = 0 }: NavbarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/book", label: "Book" },
    { href: "/dashboard/queue", label: "Schedule" },
    { href: "/dashboard/my-session", label: "My Session" },
  ];

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle>AIoT Lab Queue</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-6">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-lg py-2 px-3 rounded-md transition-colors ${
                      pathname === item.href
                        ? "bg-primary/10 text-foreground font-medium"
                        : "text-foreground/60 hover:bg-muted"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                <hr className="my-2" />
                {user && (
                  <div className="space-y-3 px-3">
                    <p className="text-sm text-muted-foreground break-all">
                      {user.email}
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleSignOut}
                    >
                      Sign Out
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/dashboard" className="font-bold text-lg">
            AIoT Lab Queue
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition-colors hover:text-foreground/80 ${
                  pathname === item.href
                    ? "text-foreground font-medium"
                    : "text-foreground/60"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {notificationCount > 0 && (
            <Badge variant="destructive" className="rounded-full">
              {notificationCount}
            </Badge>
          )}
          
          {user && (
            <div className="hidden md:flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
