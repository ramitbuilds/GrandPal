import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GrandPal: Senior Care Companion",
  description: "Simple, easy to use daily medicine companion for seniors and families.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-slate-800">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            className: "grandpal-toast",
            style: {
              background: "#ffffff",
              color: "#1e293b",
              border: "1px solid #e2e8f0",
              boxShadow: "0 12px 30px -6px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.05)",
              borderRadius: "16px",
              padding: "14px 18px",
              fontSize: "14px",
              fontWeight: "500",
            },
          }}
        />
      </body>
    </html>
  );
}
