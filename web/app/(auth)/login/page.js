// Login page — WU-1, adapted from Sedap split-screen auth layout
// No public sign-up. Admins create all accounts (Scope 1.3.6.1).

export default function LoginPage() {
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

            {/* TODO(phonlakrit): wire up Better Auth sign-in (W3–W5) */}
            <form className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="identifier"
                  className="mb-1.5 block text-xs font-medium text-[#464255]"
                >
                  Username หรือ Email
                </label>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  placeholder="you@example.com"
                  required
                  className="sedap-input"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-xs font-medium text-[#464255]"
                >
                  รหัสผ่าน
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="sedap-input"
                />
              </div>

              <button type="submit" className="sedap-btn-primary w-full">
                เข้าสู่ระบบ
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-[#a3a3a3]">
              หากยังไม่มีบัญชี กรุณาติดต่อผู้ดูแลระบบเพื่อสร้างบัญชีผู้ใช้งาน
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
