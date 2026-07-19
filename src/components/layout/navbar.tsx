"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserMenu } from "./user-menu";
import { ThemeToggle } from "./theme-toggle";
import { authClient } from "@/features/auth/auth-client";

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-14 items-center px-4">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="text-lg font-bold tracking-tight">NOKER</span>
        </Link>

        <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
          <Link
            href="/"
            className={cn(
              "hover:text-foreground/80 transition-colors",
              pathname === "/" ? "text-foreground" : "text-foreground/60",
            )}
          >
            Home
          </Link>
          {session && (
            <Link
              href="/notebooks"
              className={cn(
                "hover:text-foreground/80 transition-colors",
                pathname?.startsWith("/notebooks")
                  ? "text-foreground"
                  : "text-foreground/60",
              )}
            >
              Notebooks
            </Link>
          )}
        </nav>

        <div className="flex items-center space-x-2">
          <ThemeToggle />
          {session ? (
            <UserMenu user={session.user} />
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/login"
                className={cn(
                  "hover:text-foreground/80 text-sm font-medium transition-colors",
                  pathname === "/login"
                    ? "text-foreground"
                    : "text-foreground/60",
                )}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center rounded-md px-4 text-sm font-medium transition-colors"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
