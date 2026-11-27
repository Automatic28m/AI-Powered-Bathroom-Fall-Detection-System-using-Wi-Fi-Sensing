'use client'

// WU-1: log in with a username or an email, plus a password
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2 } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

/** @param {{ code?: string, status?: number }} error */
function toThaiMessage(error) {
  if (error.status === 429) return 'พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอ 1 นาทีแล้วลองใหม่'
  if (error.code === 'ACCOUNT_DISABLED') return 'บัญชีนี้ถูกปิดการใช้งาน กรุณาติดต่อผู้ดูแลระบบ'
  return 'ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง'
}

export default function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  /** @param {React.FormEvent<HTMLFormElement>} event */
  async function handleSubmit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const identifier = String(form.get('identifier') ?? '').trim()
    const password = String(form.get('password') ?? '')

    setPending(true)
    setError('')
    const { error: signInError } = identifier.includes('@')
      ? await authClient.signIn.email({ email: identifier, password })
      : await authClient.signIn.username({ username: identifier, password })

    if (signInError) {
      setError(toThaiMessage(signInError))
      setPending(false)
      return
    }
    // "/" sends admins to /admin and users to /home
    router.replace('/')
    router.refresh()
  }

  return (
    <form className="mt-7 space-y-5" onSubmit={handleSubmit} noValidate>
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-[14px] bg-[#ff5b5b]/15 px-4 py-3 text-sm text-[#e64545]"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label htmlFor="identifier" className="mb-1.5 block text-xs font-medium text-[#464255]">
          Username หรือ Email
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          placeholder="you@example.com"
          required
          className="sedap-input"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-[#464255]">
          รหัสผ่าน
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          className="sedap-input"
        />
      </div>

      <button type="submit" className="sedap-btn-primary w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {pending ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
      </button>
    </form>
  )
}
