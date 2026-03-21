import { Inter } from 'next/font/google'
import Providers from './providers'
import { TopNav } from '@/components/TopNav'
import "./globals.css"

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata = {
  title: 'Park_AI - Intelligence Dashboard',
  description: 'Real-time parking detection and insights via Computer Vision',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20">
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <TopNav />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
