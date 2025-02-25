'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function ArtistNav() {
  const pathname = usePathname()
  const basePath = pathname.split('/').slice(0, 3).join('/')
  
  const navItems = [
    { label: 'Overview', href: `${basePath}/overview` },
    { label: 'Metrics', href: `${basePath}/metrics` },
    { label: 'Videos', href: `${basePath}/videos` },
    { label: 'Songs', href: `${basePath}/songs` },
  ]

  return (
    <div className="sticky top-16 h-18 w-full border border-white">
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-6 py-3">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>AR</AvatarFallback>
          </Avatar>
          <span className="font-medium">Artist Name</span>
        </div>
        <nav className="flex gap-6 px-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium ${
                pathname === item.href
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
} 