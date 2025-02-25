"use client"

import { useQuery } from '@tanstack/react-query'
import { MetricsCard } from "@/components/features/artist-detail/metric-card"

async function fetchArtistMetrics(artistId: string) {
  const res = await fetch(`/api/artists/${artistId}/metrics`)
  if (!res.ok) throw new Error('Failed to fetch metrics')
  return res.json()
}

export default function MetricsPage({ artist }: { artist: Artist }) {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['artist', artist.id, 'metrics'],
    queryFn: () => fetchArtistMetrics(artist.id),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  if (isLoading) return <div>Loading metrics...</div>

  return <MetricsCard metrics={metrics} />
}