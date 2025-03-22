import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArtistGeoListening } from "@/types/geo";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export const GeoSheet = () => {
    const searchParams = useSearchParams();
    const artistId = searchParams?.get('artistId') ?? null;
    const [geoData, setGeoData] = useState<ArtistGeoListening[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchGeoData = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/artists/get-artist-geo?artistId=${artistId}`);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'Failed to fetch geo data');
            }

            setGeoData(Array.isArray(result.data) ? result.data : [result.data]);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const generateGeoData = async () => {
        if (!artistId) return;

        try {
            setIsGenerating(true);
            setError(null);

            const response = await fetch(`/api/artists/generate-artist-geo?artistId=${artistId}`, {
                method: 'POST'
            });
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'Failed to generate geo data');
            }

            // Fetch the newly generated data
            await fetchGeoData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate geo data');
        } finally {
            setIsGenerating(false);
        }
    };

    useEffect(() => {
        if (artistId) {
            fetchGeoData();
        } else {
            setError('No artist ID provided');
            setIsLoading(false);
        }
    }, [artistId]);

    const renderGenerateButton = () => (
        <Button
            onClick={generateGeoData}
            disabled={isGenerating || !artistId}
            variant="outline"
            className="w-full"
        >
            {isGenerating ? (
                <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                </>
            ) : (
                'Generate Geo Data'
            )}
        </Button>
    );

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Geographic Listening Data</CardTitle>
                </CardHeader>
                <CardContent>Loading...</CardContent>
                <CardFooter>{renderGenerateButton()}</CardFooter>
            </Card>
        );
    }

    if (error || geoData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Geographic Listening Data</CardTitle>
                </CardHeader>
                <CardContent>
                    {error && <div className="text-red-500 mb-4">{error}</div>}
                    {geoData.length === 0 && (
                        <div className="text-muted-foreground mb-4">
                            No geographic data available for this artist.
                        </div>
                    )}
                </CardContent>
                <CardFooter>{renderGenerateButton()}</CardFooter>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Geographic Listening Data</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                        {geoData.map((location) => (
                            <div key={location.id} className="flex justify-between items-center p-2 border rounded">
                                <div>
                                    <div className="font-medium">{location.city_id}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {new Date(location.date).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="font-semibold">
                                    {location.listener_count.toLocaleString()} listeners
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter>{renderGenerateButton()}</CardFooter>
        </Card>
    );
};
