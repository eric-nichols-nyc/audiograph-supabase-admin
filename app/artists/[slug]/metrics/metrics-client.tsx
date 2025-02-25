"use client"

import { useQuery } from '@tanstack/react-query'
import { MetricsCard } from "@/components/features/artist-detail/metric-card"
import { getArtistMetrics } from '@/actions/metrics'
import { usePathname } from 'next/navigation'

export function MetricsPageClient() {
  const pathname = usePathname()

  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['artist', pathname, 'metrics'],
    queryFn: async () => {
      if (!pathname) throw new Error('No pathname available')
      const result = await getArtistMetrics(pathname)
      return result.data || [] // Only one .data needed now
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  if (isLoading) return <div>Loading metrics...</div>
  if (error) return <div>Error loading metrics</div>
  if (!metrics?.length) return <div>No metrics available</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Metrics</h1>
      <MetricsCard metrics={metrics} />
    </div>
  )
} 