import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google"; // Commented out Geist fonts
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "../styles/hacker-theme.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { NotificationProvider } from "@/components/notification-context";
import { HackerLayout } from "@/components/hacker-layout";
import { Toaster } from "react-hot-toast";

// const geistSans = Geist({
//   variable: "--font-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
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
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={cn(
        "min-h-screen bg-gray-950 antialiased", // Removed font-sans as Geist was the sans font
        // geistSans.variable, // Commented out Geist font variables
        // geistMono.variable,
        jetBrainsMono.variable
      )}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <NotificationProvider>
            <HackerLayout>
              {children}
              <Toaster position="bottom-right" toastOptions={{
                duration: 4000,
                style: {
                  background: '#333',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }} />
            </HackerLayout>
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
