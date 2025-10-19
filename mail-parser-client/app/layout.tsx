import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import AuthLayout from '@/components/auth-layout'
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: 'Mail Parser HUB',
  description: 'Mail parser client',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <AuthLayout>{children}</AuthLayout>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
