import { useEffect, useState, useCallback } from 'react'
import { db, subscribeCollection } from './db'

export function useLive(collection, options = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const filtersKey = JSON.stringify(options.filters || {})
  const order = options.order || ''
  const limit = options.limit || 0

  const fetchData = useCallback(async () => {
    try {
      const parsedFilters = filtersKey ? JSON.parse(filtersKey) : {}
      const res = await db.select(collection, parsedFilters, { order, limit })
      setData(res)
    } catch (err) {
      console.error('useLive fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [collection, filtersKey, order, limit])

  useEffect(() => {
    fetchData()
    const unsubscribe = subscribeCollection(collection, () => {
      fetchData()
    })
    return () => {
      unsubscribe()
    }
  }, [collection, fetchData])

  return { data, loading, refetch: fetchData }
}

export function useLiveShared(collection, options = {}) {
  return useLive(collection, options)
}
