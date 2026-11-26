// Root layout — sets fonts and global styles
// See DesignSystem.md §3 for font choices

import { Inter, Noto_Sans_Thai } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const notoThai = Noto_Sans_Thai({ subsets: ['thai'], variable: '--font-noto-thai', weight: ['400', '500', '600'] })

/** @type {import('next').Metadata} */
export const metadata = {
  title: 'Fall Watch — ระบบตรวจจับการล้ม',
  description: 'Real-time bathroom fall detection using Wi-Fi CSI',
}

/**
 * @param {{ children: React.ReactNode }} props
 */
export default function RootLayout({ children }) {
  return (
    <html lang="th" className={`${inter.variable} ${notoThai.variable}`}>
      <body className="bg-slate-50 font-sans text-slate-900 antialiased">
        {children}
      </body>
    </html>
  )
}
