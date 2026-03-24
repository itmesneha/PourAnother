import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const dirtyCursive = localFont({
  src: "../public/fonts/DirtyCursive.ttf",
  variable: "--font-dirty-cursive",
  display: "swap",
});

const anticaSignature = localFont({
  src: "../public/fonts/AnticaSignature.otf",
  variable: "--font-antica-signature",
  display: "swap",
});

const malvinassignature = localFont({
  src: "../public/fonts/MalvinasSignature.ttf",
  variable: "--font-malvinas-signature",
  display: "swap",
});

const tychrc2u = localFont({
  src: "../public/fonts/TychRc2U.ttf",
  variable: "--font-tychrc2u",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pour Another",
  description: "Every mood has a drink waiting for it.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dirtyCursive.variable} ${anticaSignature.variable} ${malvinassignature.variable} ${tychrc2u.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
