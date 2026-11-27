// zod schemas for /api/accounts (WA-1, WA-3, WA-5)
import { z } from 'zod'

// Same rule as the Better Auth username plugin, so every account can log in.
// Stored lowercase.
export const usernameSchema = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9_.]{3,30}$/, 'ใช้ a-z, 0-9, _ หรือ . ความยาว 3–30 ตัวอักษร')
  .transform((s) => s.toLowerCase())

// Thai phone numbers: 0 + 8–9 digits. Spaces and dashes are removed.
const phoneSchema = z
  .string()
  .transform((s) => s.replace(/[\s-]/g, ''))
  .pipe(z.string().regex(/^0\d{8,9}$/, 'เบอร์โทรศัพท์ไม่ถูกต้อง'))

const baseAccount = {
  username: usernameSchema,
  password: z.string().min(8, 'รหัสผ่านอย่างน้อย 8 ตัวอักษร').max(128),
  fullName: z.string().trim().min(1, 'กรุณากรอกชื่อ-นามสกุล').max(120),
  phone: phoneSchema,
  email: z.email('อีเมลไม่ถูกต้อง').transform((s) => s.toLowerCase()),
}

// WA-1 admin: username, password, full name, phone, email
// WA-3 user:  same + address
export const createAccountSchema = z.discriminatedUnion('role', [
  z.object({ role: z.literal('admin'), ...baseAccount }),
  z.object({
    role: z.literal('user'),
    ...baseAccount,
    address: z.string().trim().min(1, 'กรุณากรอกที่อยู่').max(300),
  }),
])

// WA-5: turn a user account on or off
export const updateAccountSchema = z.object({ isActive: z.boolean() })

export const listAccountsQuerySchema = z.object({
  role: z.enum(['admin', 'user']).optional(),
  q: z.string().trim().max(100).optional(),
})
