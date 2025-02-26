"use client"

import Image from "next/image"

export function SimilarArtists() {
  const artists = [
    {
      name: "Bruno Mars",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-02-26%20at%203.28.11%E2%80%AFPM-1wcjHtDtpvUQmn7UDNwUh8yAFcFhbr.png#xywh=112,147,170,170",
    },
    {
      name: "The Neighbourhood",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-02-26%20at%203.28.11%E2%80%AFPM-1wcjHtDtpvUQmn7UDNwUh8yAFcFhbr.png#xywh=370,147,170,170",
    },
    {
      name: "Jack Harlow",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-02-26%20at%203.28.11%E2%80%AFPM-1wcjHtDtpvUQmn7UDNwUh8yAFcFhbr.png#xywh=628,147,170,170",
    },
    {
      name: "Drake",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-02-26%20at%203.28.11%E2%80%AFPM-1wcjHtDtpvUQmn7UDNwUh8yAFcFhbr.png#xywh=886,147,170,170",
    },
    {
      name: "French Montana",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-02-26%20at%203.28.11%E2%80%AFPM-1wcjHtDtpvUQmn7UDNwUh8yAFcFhbr.png#xywh=1144,147,170,170",
    },
  ]

  return (
    <div className="w-full bg-[#141e3c] text-white p-6 rounded-lg">
      <h1 className="text-2xl font-bold mb-1">Compare Artist</h1>
      <p className="text-sm text-gray-300 mb-8">Performance against similar artists in the last 28 days</p>

      <div className="flex flex-wrap justify-between gap-4">
        {artists.map((artist, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-2 border-white mb-3">
              <Image
                src={artist.image || "/placeholder.svg"}
                alt={artist.name}
                width={112}
                height={112}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-sm md:text-base text-center">{artist.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
} 