export interface ArtistGeoListening {
    id: string;
    artist_id: string;
    city_id: string;
    listener_count: number;
    date: Date;
    created_at?: Date;
    updated_at?: Date;
}

// This type represents the structure of the artist_geo_listening table
// TODO: Refine types and add any missing fields once database connection is established
