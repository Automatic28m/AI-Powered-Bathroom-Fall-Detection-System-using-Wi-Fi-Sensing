// Root layout — Sedap-inspired light theme with Noto Sans Thai + Barlow + Poppins
// See docs/DesignSystem.md §3

import { Barlow, Noto_Sans_Thai, Poppins } from 'next/font/google'
import './globals.css'

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-barlow',
})

const notoThai = Noto_Sans_Thai({
  subsets: ['thai'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-thai',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-poppins',
})

/** @type {import('next').Metadata} */
export const metadata = {
  title: 'FallWatch. — ระบบตรวจจับการล้มอัจฉริยะด้วยคลื่นไวไฟ',
  description: 'Real-time bathroom fall detection using Wi-Fi CSI and VLM',
}

/**
 * @param {{ children: React.ReactNode }} props
 */
export default function RootLayout({ children }) {
  return (
    <html lang="th" className={`${barlow.variable} ${notoThai.variable} ${poppins.variable}`}>
      <body className="bg-[#f3f2f7] font-sans text-[#333333] antialiased">{children}</body>
    </html>
  )
}
