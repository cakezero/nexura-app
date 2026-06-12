import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Nexura - Discover & Earn",
  description: "Nexura - Discover & Earn",
  icons: {
    icon: "/LOGO500.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`dark ${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div id="modal-root" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
