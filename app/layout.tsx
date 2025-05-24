import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationProvider } from "@/components/notification-context";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Torrent Videoclub - Curador Visual",
  description: "Curador visual para descubrir y agregar películas/series desde trackers conectados a arr-stack",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        geistSans.variable,
        geistMono.variable
      )}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <NotificationProvider>
        <div className="relative flex min-h-screen flex-col">
          
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
              <div className="mr-4 flex">
                <Link href="/" className="mr-6 flex items-center space-x-2">
                  <span className="font-bold">Torrent Videoclub</span>
                </Link>
                <nav className="flex items-center space-x-6 text-sm font-medium">
                  <Link href="/movies" className="transition-colors hover:text-foreground/80">
                    Películas
                  </Link>
                  <Link href="/series" className="transition-colors hover:text-foreground/80">
                    Series
                  </Link>
                </nav>
              </div>
              <div className="ml-auto flex items-center">
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t py-6 md:py-0">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row">
              <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                {new Date().getFullYear()} Torrent Videoclub. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
        </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
