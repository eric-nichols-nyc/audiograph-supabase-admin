/**
 * Helper function to find Wikipedia entry for an artist
 */
export async function findWikipediaEntry(artistName: string) {
    const sanitizedName = encodeURIComponent(artistName)
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=info&inprop=url&titles=${sanitizedName}&origin=*`
  
    try {
      const response = await fetch(apiUrl)
      const data = await response.json()
      const pages = data.query.pages
      const pageId = Object.keys(pages)[0]
  
      return pageId !== "-1" ? {
        url: pages[pageId].fullurl,
        title: pages[pageId].title
      } : null
    } catch (error) {
      console.error('Wikipedia search error:', error)
      return null
    }
  }
