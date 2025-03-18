"use client"
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button"
import Image from "next/image"


interface SimArtists {
    name: string;
    image: string;
}

export function SimilarArtists() {
    const [similarArtists, setSimilarArtists] = useState<SimArtists[]>([])
    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch('/api/artists/get-similar-artists')
            const json = await response.json()
            setSimilarArtists(json.data)
        }
        fetchData()
    }, [])

    return (
        <div className="w-full bg-[#141e3c] text-white p-6 rounded-lg">
            <h1 className="text-2xl font-bold mb-1">Similar Artist</h1>
            <div className="flex flex-wrap justify-between gap-4">
                {similarArtists.map((artist, index) => (
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
            <Button>Generate Similar Artists</Button>
        </div>
    )
}
