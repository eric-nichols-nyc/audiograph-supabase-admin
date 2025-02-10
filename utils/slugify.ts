export function createSlug(artistName: string): string {
    return artistName
        .toLowerCase() // Convert to lowercase
        .trim() // Remove whitespace from both ends
        .replace(/[\s\W-]+/g, '-') // Replace spaces and non-word characters with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
}