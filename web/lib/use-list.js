'use client'

// Load a paged list from our API. Only the newest request may update the state,
// so a slow older search can't overwrite a newer one.
import { useCallback, useEffect, useRef, useState } from 'react'
import { apiRequest } from '@/lib/client-api'

/**
 * @param {string} path  e.g. "/api/houses"
 * @param {Record<string, string | number | undefined>} query  page, pageSize, filters
 * @param {string} loadErrorMessage
 */
export function useList(path, query, loadErrorMessage) {
  const [data, setData] = useState(
    /** @type {{ items: any[], total: number }} */ ({ items: [], total: 0 })
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const requestId = useRef(0)

  const queryString = new URLSearchParams(
    Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => [k, String(v)])
  ).toString()

  const reload = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    setError('')
    const res = await apiRequest(`${path}?${queryString}`)
    if (id !== requestId.current) return
    if (res.ok) setData(res.data)
    else setError(res.error.code === 'NETWORK' ? res.error.message : loadErrorMessage)
    setLoading(false)
  }, [path, queryString, loadErrorMessage])

  useEffect(() => {
    reload()
  }, [reload])

  return { data, setData, loading, error, reload }
}

/**
 * Search box value that updates `search` after typing pauses.
 * @param {() => void} [onChange]  e.g. go back to page 1
 */
export function useDebouncedSearch(onChange) {
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  useEffect(() => {
    const next = query.trim()
    if (next === search) return undefined
    const t = setTimeout(() => {
      setSearch(next)
      onChangeRef.current?.()
    }, 300)
    return () => clearTimeout(t)
  }, [query, search])
  return { query, setQuery, search }
}
