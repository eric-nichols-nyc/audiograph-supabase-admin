import {createSpotifyService} from "@/services/spotify-service"
import { NextResponse } from "next/server"
export async function GET(request: Request) {
    const {searchParams} = new URL(request.url)
    const spotifyId = searchParams.get("spotifyId")
    const spotifyService = createSpotifyService()
    const trackData = await spotifyService.getTrackData(spotifyId)
    return NextResponse.json(trackData)
}