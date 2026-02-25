import type { Metadata } from "next"
import { Inter, Righteous } from "next/font/google"
import "./globals.css"
import { RootLayoutClient } from "./layout.client"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const righteous = Righteous({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-righteous",
})

export const metadata: Metadata = {
  title: {
    default: 'Audit AllStars - Workflow Sharing Platform for Auditors',
    template: '%s | Audit AllStars'
  },
  icons: {
    icon: '/star-gold.svg',
    apple: '/star-gold.svg',
  },
  description: 'The Audit All-Stars platform for internal auditors to discover and share AI-powered audit workflows.',
  authors: [{ name: "Rich Penfil" }],
  creator: 'Audit AllStars',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="allstars">
      <body className={`${inter.className} ${righteous.variable}`}>
        <RootLayoutClient>
          {children}
        </RootLayoutClient>
      </body>
    </html>
  )
}
