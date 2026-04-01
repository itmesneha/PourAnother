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

const antically = localFont({
  src: "../public/fonts/Antically.ttf",
  variable: "--font-antically",
  display: "swap",
});

export const metadata: Metadata = {                                                                                                  
    title: "Pour Another",                                                                                                             
    description: "Every mood has a drink waiting for it.",                                                                             
    icons: { icon: "/favicon.png" },                                                                                                   
    openGraph: {                                                                                                                     
      title: "Pour Another",                                                                                                           
      description: "Every mood has a drink waiting for it.",                                                                         
      url: "https://pour-another.vercel.app/",
      siteName: "Pour Another",                                                                                                        
      images: [{ url: "https://pour-another.vercel.app/og-image.png", width: 1200, height: 630 }],
      type: "website",                                                                                                                 
    },                                                                                                                               
    twitter: {                                                                                                                         
      card: "summary_large_image",                                                                                                   
      title: "Pour Another",
      description: "Every mood has a drink waiting for it.",
      images: ["https://pour-another.vercel.app/og-image.png"],                                                                                                       
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
      className={`${dirtyCursive.variable} ${anticaSignature.variable} ${malvinassignature.variable} ${tychrc2u.variable} ${antically.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <footer className="mt-auto py-4 text-center text-sm opacity-50">
          made with ❤️ by cabbagefairy
        </footer>
      </body>
    </html>
  );
}
