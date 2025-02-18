import { WikipediaService } from './wikipedia-service';

export class ArtistService {
  private wikiService = new WikipediaService();

  async updateArtistWikiData(artistId: string, wikiTitle: string) {
    // Get pageviews for the last 30 days
    await this.wikiService.getPageViews(wikiTitle);
    // Rest of your update logic...
  }
} 