export function createSlug(artistName: string): string {
    // Trim whitespace, remove spaces and dashes, and convert to lowercase
    return artistName.trim().replace(/[\s-]+/g, '').toLowerCase();
}