import type { Metadata } from "next";
import { JetBrains_Mono, Cormorant_Garamond, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { ThemeProvider } from "@/context/ThemeContext";
import TopStrip from "@/components/TopStrip";
import Header from "@/components/Header";
import CartSidebar from "@/components/CartSidebar";
import Toast from "@/components/Toast";
import Tweaks from "@/components/Tweaks";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-next",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif-next",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans-next",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Eastern Angelica — EA Recordings",
  description:
    "Independent record label out of Warsaw. Folk, rap, and liturgy of the eastern edge.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Pinyon+Script&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${jetbrainsMono.variable} ${cormorant.variable} ${spaceGrotesk.variable}`}
        data-theme="dark"
        data-accent="bone"
        data-typo="mono-serif"
      >
        <ThemeProvider>
          <CartProvider>
            <TopStrip />
            <Header />
            {children}
            <CartSidebar />
            <Toast />
            <Tweaks />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
