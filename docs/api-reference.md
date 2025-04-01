# API Reference

This document provides detailed information about the available API endpoints in the AudioGraph Supabase Admin application.

## Table of Contents
- [Artist Platform IDs](#artist-platform-ids)
  - [Update Artist Platform ID](#update-artist-platform-id)

## Artist Platform IDs

### Update Artist Platform ID

Updates or creates a platform ID for a specific artist.

**URL**: `/api/artist-platform-id`

**Method**: `PATCH`

**Request Body**:
```json
{
  "artist_id": "string",     // Required: The ID of the artist
  "platform": "string",      // Required: The platform identifier
  "platform_id": "string"    // Required: The ID of the artist on the specified platform
}
```

**Supported Platforms**:
- `spotify`
- `youtube`
- `deezer`
- `genius`
- `yt_charts`
- `musicbrainz`

**Success Response**:
- **Code**: 200
- **Content**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "artist_id": "string",
    "platform": "string",
    "platform_id": "string",
    "created_at": "string",
    "updated_at": "string"
  }
}
```

**Error Responses**:

*Missing Required Fields*
- **Code**: 400
- **Content**:
```json
{
  "success": false,
  "message": "artist_id, platform, and platform_id are required"
}
```

*Invalid Platform*
- **Code**: 400
- **Content**:
```json
{
  "success": false,
  "message": "Platform must be one of: spotify, youtube, deezer, genius, yt_charts, musicbrainz"
}
```

*Server Error*
- **Code**: 500
- **Content**:
```json
{
  "success": false,
  "message": "Error message details"
}
```

**Example Request**:
```bash
curl -X PATCH http://localhost:3001/api/artist-platform-id \
  -H "Content-Type: application/json" \
  -d '{
    "artist_id": "123",
    "platform": "spotify",
    "platform_id": "spotify_artist_id_123"
  }'
```

**Notes**:
- If a platform ID already exists for the specified artist and platform, it will be updated.
- If no platform ID exists, a new record will be created.
- The `updated_at` timestamp is automatically set when updating an existing record. 