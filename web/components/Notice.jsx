'use client'

// Short success / error message above a table, hidden after a few seconds
import { useCallback, useEffect, useRef, useState } from 'react'

/** @typedef {{ message: string, tone: 'ok' | 'error' } | null} NoticeState */

/** @returns {[NoticeState, (message: string, tone?: 'ok' | 'error') => void]} */
export function useNotice() {
  const [notice, setNotice] = useState(/** @type {NoticeState} */ (null))
  /** @type {React.MutableRefObject<ReturnType<typeof setTimeout> | undefined>} */
  const timer = useRef(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const flash = useCallback(
    /** @param {string} message @param {'ok' | 'error'} [tone] */
    (message, tone = 'ok') => {
      clearTimeout(timer.current)
      setNotice({ message, tone })
      timer.current = setTimeout(() => setNotice(null), tone === 'error' ? 5000 : 3000)
    },
    []
  )
  return [notice, flash]
}

/** @param {{ notice: NoticeState }} props */
export default function Notice({ notice }) {
  if (!notice) return null
  return (
    <p
      role={notice.tone === 'error' ? 'alert' : 'status'}
      className={`rounded-[14px] px-4 py-3 text-sm font-medium ${
        notice.tone === 'error'
          ? 'bg-[#ff5b5b]/15 text-[#e64545]'
          : 'bg-[#00b074]/15 text-[#009663]'
      }`}
    >
      {notice.message}
    </p>
  )
}

/** Red error box inside a form. @param {{ message: string }} props */
export function FormError({ message }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-[14px] bg-[#ff5b5b]/15 px-4 py-3 text-sm text-[#e64545]">
      {message}
    </p>
  )
}
