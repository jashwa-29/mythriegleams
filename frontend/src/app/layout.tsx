"use client";

import { Cormorant_Garamond, DM_Sans, Playfair_Display, Quicksand } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnnouncementBar from "@/components/AnnouncementBar";
import CartDrawer from "@/components/CartDrawer";
import { ReduxProvider } from "@/components/ReduxProvider";
import { usePathname } from "next/navigation";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-serif",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-playfair",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-quicksand",
});

import { Toaster } from "react-hot-toast";
import { useEffect } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin  = pathname.startsWith("/admin");

  // Fix for cross-page hash navigation
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      setTimeout(() => {
        const id = window.location.hash.replace("#", "");
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 500); // Small delay to ensure content is rendered
    }
  }, [pathname]);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${cormorant.variable} ${dmSans.variable} ${playfair.variable} ${quicksand.variable} h-full antialiased`}
    >
      <head>
        <title>Mythris Gleams | Handcrafted Clay Miniatures &amp; South Indian Heritage Art</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
        <meta
          name="description"
          content="Shop handcrafted clay miniatures, traditional Tamil Nadu street shops, miniature fruit baskets, vegetable crates, and Navaratri Thamboolam return gifts by Mythris Gleams."
        />
        <link rel="icon" href="/logo.png" />
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans overflow-x-hidden w-full relative">
        <ReduxProvider>
          <Toaster position="top-right" />
          {!isAdmin && <Navbar />}
          <main className="flex-grow w-full overflow-x-hidden">
            {children}
          </main>
          {!isAdmin && <Footer />}
          {!isAdmin && <CartDrawer />}
        </ReduxProvider>
      </body>
    </html>
  );
}
