'use client'

// Houses for a <select>. Loads the first 100 (the API's page limit), sorted by name.
import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/client-api'

/** @returns {{ houses: { id: number, name: string }[], error: string }} */
export function useHouseOptions() {
  const [houses, setHouses] = useState(/** @type {{ id: number, name: string }[]} */ ([]))
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    apiRequest('/api/houses?pageSize=100').then((res) => {
      if (cancelled) return
      if (res.ok) {
        setHouses(
          res.data.items
            .map((/** @type {any} */ h) => ({ id: h.id, name: h.name }))
            .sort((/** @type {any} */ a, /** @type {any} */ b) =>
              a.name.localeCompare(b.name, 'th')
            )
        )
      } else setError('โหลดรายชื่อบ้านไม่สำเร็จ')
    })
    return () => {
      cancelled = true
    }
  }, [])

  return { houses, error }
}
