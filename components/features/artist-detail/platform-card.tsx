import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react"
import { PlatformIcon } from "@/components/features/artist-detail/platform-icon"
import type { Platform } from "@/lib/types"

interface PlatformCardProps {
  platform: Platform
}

export function PlatformCard({ platform }: PlatformCardProps) {
  // Add null check for platform
  if (!platform) {
    return null
  }

  const { name, count, growth, change, icon } = platform

  // Format large numbers with commas
  const formattedCount = count.toLocaleString()
  const formattedChange = change ? change.toLocaleString() : "0"

  // Determine growth indicator
  let growthIndicator = null
  let growthColor = "text-gray-400"

  if (growth !== null && growth !== undefined) {
    if (growth > 0) {
      growthIndicator = <ArrowUpIcon className="h-4 w-4" />
      growthColor = "text-green-500"
    } else if (growth < 0) {
      growthIndicator = <ArrowDownIcon className="h-4 w-4" />
      growthColor = "text-red-500"
    } else {
      growthIndicator = <MinusIcon className="h-4 w-4" />
    }
  }

  return (
    <div className="bg-[#1a2747] rounded-lg p-4 flex items-center space-x-3">
      <div className="flex-shrink-0">
        <PlatformIcon platform={icon} />
      </div>
      <div className="flex-1">
        <div className="text-xs text-gray-400 uppercase">{name}</div>
        <div className="text-xl font-bold">{formattedCount}</div>
        <div className={`text-sm flex items-center ${growthColor}`}>
          {growthIndicator}
          <span className="ml-1">{growth !== null ? `${Math.abs((growth || 0) * 100).toFixed(1)}%` : "0%"}</span>
          <span className="ml-1 text-gray-400">
            {change && change !== 0 ? `(${change > 0 ? "+" : ""}${formattedChange})` : ""}
          </span>
        </div>
      </div>
    </div>
  )
}

