import { MetricsPageClient } from './metrics-client'
import { ContentLayout } from '@/components/features/admin-panel/content-layout'

export default function MetricsPage() {
  return (
    <ContentLayout>
      <MetricsPageClient />
    </ContentLayout>
  )
}