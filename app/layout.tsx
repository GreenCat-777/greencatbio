import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GreenCat777 Bio",
  description: "All About GreenCat777, Kindle Enthusiast, Documenter, and more.",
  generator: "v0.app",
  openGraph: {
    type: "website",
    title: "GreenCat777",
    description: "All About GreenCat777, Kindle Enthusiast, Documenter, and more.",
    url: "https://greencat-777.github.io/",
    images: [
      {
        url: "/embed-final.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GreenCat777",
    description: "All About GreenCat777, Kindle Enthusiast, Documenter, and more.",
    images: ["/embed-final.png"],
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`font-mono antialiased bg-black text-[#0ed145] min-h-screen flex items-center justify-center p-5`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  )
}
