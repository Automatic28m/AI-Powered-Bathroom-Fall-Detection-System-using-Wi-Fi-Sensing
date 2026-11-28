// Login page — WU-1, adapted from Sedap split-screen auth layout
// No public sign-up. Admins create all accounts (Scope 1.3.6.1).
import { redirect } from 'next/navigation'
import { getCurrentUser, HOME_BY_ROLE } from '@/lib/session'
import LoginForm from './LoginForm'

export const metadata = { title: 'เข้าสู่ระบบ — FallWatch.' }

export default async function LoginPage() {
  // Already logged in: go straight to the right dashboard
  const user = await getCurrentUser()
  if (user) redirect(HOME_BY_ROLE[user.role])

  return (
    <main className="grid min-h-dvh bg-[#f3f2f7] lg:grid-cols-[minmax(0,36rem)_1fr]">
      {/* Left brand panel (Sedap auth-layout) */}
      <aside className="relative hidden overflow-hidden bg-[#00b074] px-14 py-12 text-white lg:flex lg:flex-col">
        <span
          className="absolute -right-28 -top-28 size-80 rounded-full bg-white/10"
          aria-hidden="true"
        />
        <span
          className="absolute -bottom-40 -left-24 size-96 rounded-full bg-white/10"
          aria-hidden="true"
        />

        <div className="relative">
          <span className="font-brand text-4xl font-bold tracking-tight text-white">
            FallWatch<span className="text-[#f7c604]">.</span>
          </span>
          <p className="mt-2 text-sm text-white/80">ระบบตรวจจับการล้มในห้องน้ำอัจฉริยะด้วยคลื่นไวไฟ</p>
        </div>

        <div className="relative my-auto max-w-md">
          <h1 className="text-3xl font-semibold leading-snug text-white">
            เฝ้าระวังแบบเรียลไทม์ รักษาความเป็นส่วนตัว 100%
          </h1>
          <p className="mt-4 text-base leading-relaxed text-white/85">
            วิเคราะห์สัญญาณ Wi-Fi CSI ด้วยปัญญาประดิษฐ์ (VLM) ไม่ใช้กล้องวงจรปิด และไม่จำเป็นต้องสวมใส่อุปกรณ์ติดตัว
          </p>
        </div>

        <p className="relative text-xs text-white/75">
          © 2569 โครงงาน C2 — ภาควิชาวิศวกรรมคอมพิวเตอร์ มทร.ธัญบุรี
          <br />
          {/* Attribution kept from the Sedap free template ("Credit required") */}
          Template: Sedap by{' '}
          <a
            href="https://themewagon.com"
            target="_blank"
            rel="noopener"
            className="text-white/90 underline underline-offset-2"
          >
            ThemeWagon
          </a>
        </p>
      </aside>

      {/* Right login card */}
      <section className="flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-[28rem]">
          <div className="mb-8 text-center lg:hidden">
            <span className="font-brand text-3xl font-bold tracking-tight text-[#333333]">
              FallWatch<span className="text-[#00b074]">.</span>
            </span>
            <p className="mt-1 text-xs text-[#a3a3a3]">ระบบตรวจจับการล้มอัจฉริยะด้วยคลื่นไวไฟ</p>
          </div>

          <div className="sedap-card p-8">
            <h2 className="text-2xl font-semibold text-[#464255]">เข้าสู่ระบบ</h2>
            <p className="mt-1.5 text-sm text-[#a3a3a3]">
              กรุณากรอกชื่อผู้ใช้หรืออีเมล และรหัสผ่านเพื่อเข้าใช้งาน
            </p>

            <LoginForm />

            <p className="mt-6 text-center text-xs text-[#a3a3a3]">
              หากยังไม่มีบัญชี กรุณาติดต่อผู้ดูแลระบบเพื่อสร้างบัญชีผู้ใช้งาน
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
