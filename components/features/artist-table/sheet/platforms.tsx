import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface Platform {
    id: string;
    name: string;
    isConnected: boolean;
    icon: string;
}

const platforms: Platform[] = [
    {
        id: "youtube",
        name: "YouTube",
        isConnected: true,
        icon: "/images/youtube.svg"
    },
    {
        id: "spotify",
        name: "Spotify",
        isConnected: false,
        icon: "/images/spotify.svg"
    },
    {
        id: "deezer",
        name: "Deezer",
        isConnected: true,
        icon: "/images/deezer.svg"
    },
    {
        id: "genius",
        name: "Genius",
        isConnected: false,
        icon: "/images/genius.svg"
    },
    {
        id: "youtube_charts",
        name: "YouTube Charts",
        isConnected: true,
        icon: "/images/youtube.svg"
    }
];

export const PlatformsSheet = () => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Platform Connections</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {platforms.map((platform) => (
                        <div
                            key={platform.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="w-8 h-8 flex items-center justify-center">
                                    <img
                                        src={platform.icon}
                                        alt={platform.name}
                                        className="w-6 h-6"
                                    />
                                </div>
                                <span className="font-medium">{platform.name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                {platform.isConnected ? (
                                    <>
                                        <span className="text-sm text-green-600 font-medium">Connected</span>
                                        <Check className="w-5 h-5 text-green-600" />
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => console.log(`Connect to ${platform.name}`)}
                                        >
                                            Connect
                                        </Button>
                                        <X className="w-5 h-5 text-red-500" />
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
