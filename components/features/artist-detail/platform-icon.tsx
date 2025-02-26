import type React from "react"
import { Facebook, Instagram, Twitter, Youtube, Music, TrendingUp, Award, Radio, Heart, Users } from "lucide-react"

interface PlatformIconProps {
  platform: string
  className?: string
}

export function PlatformIcon({ platform, className = "h-8 w-8" }: PlatformIconProps) {
  // Add null check for platform
  const platformKey = platform?.toLowerCase() || "default"

  // Map platform names to icons
  const iconMap: Record<string, React.ReactNode> = {
    amazon: (
      <div className="text-[#FF9900]">
        <Award className={className} />
      </div>
    ),
    audiomack: (
      <div className="text-[#FFA500]">
        <Music className={className} />
      </div>
    ),
    bandsintown: (
      <div className="text-[#00B4B3]">
        <Radio className={className} />
      </div>
    ),
    boomplay: (
      <div className="text-white">
        <Music className={className} />
      </div>
    ),
    deezer: (
      <div className="text-[#FF0092]">
        <Heart className={className} />
      </div>
    ),
    facebook: (
      <div className="text-[#1877F2]">
        <Facebook className={className} />
      </div>
    ),
    gaana: (
      <div className="text-[#E72C30]">
        <Music className={className} />
      </div>
    ),
    genius: (
      <div className="text-white">
        <Award className={className} />
      </div>
    ),
    instagram: (
      <div className="text-[#E1306C]">
        <Instagram className={className} />
      </div>
    ),
    jiosaavn: (
      <div className="text-[#2BC5B4]">
        <Music className={className} />
      </div>
    ),
    linemusic: (
      <div className="text-[#00B900]">
        <Music className={className} />
      </div>
    ),
    melon: (
      <div className="text-[#00CD3C]">
        <Music className={className} />
      </div>
    ),
    qqmusic: (
      <div className="text-[#FFC028]">
        <Music className={className} />
      </div>
    ),
    songkick: (
      <div className="text-[#F80046]">
        <Radio className={className} />
      </div>
    ),
    soundcloud: (
      <div className="text-[#FF7700]">
        <Radio className={className} />
      </div>
    ),
    spotify: (
      <div className="text-[#1DB954]">
        <Music className={className} />
      </div>
    ),
    tiktok: (
      <div className="text-white">
        <TrendingUp className={className} />
      </div>
    ),
    triller: (
      <div className="text-[#FF0050]">
        <TrendingUp className={className} />
      </div>
    ),
    twitter: (
      <div className="text-[#1DA1F2]">
        <Twitter className={className} />
      </div>
    ),
    yandex: (
      <div className="text-[#FFCC00]">
        <Music className={className} />
      </div>
    ),
    youtube: (
      <div className="text-[#FF0000]">
        <Youtube className={className} />
      </div>
    ),
    default: (
      <div className="text-gray-400">
        <Users className={className} />
      </div>
    ),
  }

  return (
    <div className="flex items-center justify-center w-10 h-10 rounded-md bg-[#243050]">
      {iconMap[platformKey] || iconMap.default}
    </div>
  )
}

