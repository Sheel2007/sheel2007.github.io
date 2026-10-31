import type React from "react"
import "@/app/globals.css"
import type { Metadata } from "next"
import { Barlow_Condensed, IBM_Plex_Mono, Source_Serif_4 } from "next/font/google"

const display = Barlow_Condensed({ subsets: ["latin"], weight: ["500", "700", "800"], variable: "--font-display" })
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif" })
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "Sheel Shah",
  description: "Computer science student building software, machine learning models and hardware.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${serif.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
