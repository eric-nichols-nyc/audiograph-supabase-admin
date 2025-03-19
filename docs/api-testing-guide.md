# Testing Artist Similarity API with Postman

This guide provides instructions for testing the artist similarity calculation API endpoints using Postman.

## Prerequisites

- [Postman](https://www.postman.com/downloads/) installed
- Your Supabase project URL (e.g., `https://your-project-id.supabase.co`)
- A valid JWT token for authentication (can be obtained from your browser's local storage after logging in)
- Artist IDs for testing

## API Endpoints

### 1. Get Similar Artists

This endpoint retrieves similar artists for a given artist ID. If similarities don't exist, it will automatically calculate them.

- **URL**: `GET /api/artists/get-similar-artists?id={artistId}`
- **Method**: `GET`
- **Authentication**: None required (handled by the service)

#### Postman Setup

1. Create a new GET request
2. Set the URL to: `http://localhost:3000/api/artists/get-similar-artists?id={artistId}`
   - Replace `{artistId}` with a valid artist UUID
3. Click "Send"

#### Expected Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "name": "Artist Name",
      "image_url": "https://example.com/image.jpg",
      "genres": ["pop", "rock"],
      "similarity_score": 0.85,
      "factors": {
        "genre_similarity": 0.75,
        "name_similarity": 0.2,
        "content_similarity": 0.9
      }
    },
    // More similar artists...
  ]
}
```

### 2. Generate Similar Artists

This endpoint explicitly triggers the similarity calculation for a specific artist.

- **URL**: `POST /api/artists/{artistId}/generate-similar-artists`
- **Method**: `POST`
- **Authentication**: None required (handled by the service)

#### Postman Setup

1. Create a new POST request
2. Set the URL to: `http://localhost:3000/api/artists/{artistId}/generate-similar-artists`
   - Replace `{artistId}` with a valid artist UUID
3. Click "Send"

#### Expected Response

```json
{
  "success": true,
  "calculation_result": {
    "success": true,
    "processed": [
      {
        "artist_id": "uuid-here",
        "artist_name": "Artist Name",
        "similarities_calculated": 28
      }
    ],
    "total_artists_processed": 1
  },
  "similar_artists": [
    {
      "id": "uuid-here",
      "name": "Artist Name",
      "image_url": "https://example.com/image.jpg",
      "genres": ["pop", "rock"],
      "similarity_score": 0.85,
      "factors": {
        "genre_similarity": 0.75,
        "name_similarity": 0.2,
        "content_similarity": 0.9
      }
    },
    // More similar artists...
  ]
}
```

## Testing Workflow

For a complete test of the similarity calculation system, follow these steps:

1. **Find an Artist ID to Test**:
   - You can get an artist ID from your database or use the `/api/artists` endpoint

2. **Generate Similarities**:
   - Use the POST endpoint to explicitly calculate similarities for the artist
   - This will invoke the Edge Function and store results in the database

3. **Retrieve Similar Artists**:
   - Use the GET endpoint to retrieve the calculated similar artists
   - Verify that the similarity scores and factors are present

4. **Test Auto-Calculation**:
   - Delete the artist's similarities from the database (if you have access)
   - Use the GET endpoint again - it should automatically recalculate similarities

## Troubleshooting

If you encounter issues:

1. **Check Artist ID**: Ensure the artist ID exists in your database
2. **Verify Edge Function**: Make sure the Supabase Edge Function is deployed and accessible
3. **Check Network Tab**: In Postman, examine the response status and body for error messages
4. **Server Logs**: Check your Next.js server logs for any errors during API calls

## Example Postman Collection

You can import this collection into Postman for quick testing:

```json
{
  "info": {
    "name": "Artist Similarity API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get Similar Artists",
      "request": {
        "method": "GET",
        "url": {
          "raw": "http://localhost:3000/api/artists/get-similar-artists?id={{artistId}}",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "artists", "get-similar-artists"],
          "query": [
            {
              "key": "id",
              "value": "{{artistId}}"
            }
          ]
        }
      }
    },
    {
      "name": "Generate Similar Artists",
      "request": {
        "method": "POST",
        "url": {
          "raw": "http://localhost:3000/api/artists/{{artistId}}/generate-similar-artists",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "artists", "{{artistId}}", "generate-similar-artists"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "artistId",
      "value": "your-artist-uuid-here"
    }
  ]
}
```

Replace `your-artist-uuid-here` with a valid artist ID from your database.
