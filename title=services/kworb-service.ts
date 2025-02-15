import { Page } from 'playwright';

export class KworbService {
  private async _scrapeKworbData(page: Page, type: string) {
    if (type === 'videos') {
      // Scrape videos and return both stats and videos.
      const result = await page.evaluate(() => {
        // Get all subcontainers on the page.
        const subcontainers = Array.from(document.querySelectorAll('.subcontainer'));
        let stats = [];
        let videos = [];
        console.log('Found subcontainers:', subcontainers.length);

        if (subcontainers.length > 0) {
          // Find the container holding the stats table (the one with a table that is NOT "addpos sortable").
          const statsContainer = subcontainers.find(sc => sc.querySelector('table:not(.addpos.sortable)'));
          if (statsContainer) {
            const statsTable = statsContainer.querySelector('table:not(.addpos.sortable)');
            if (statsTable) {
              stats = Array.from(statsTable.querySelectorAll('tbody tr')).map(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length < 2) return null;
                const label = cells[0].textContent?.trim() || "";
                const value = cells[1].textContent?.trim() || "";
                return { label, value };
              }).filter(item => item !== null);
            }
          } else {
            console.log("No stats container found.");
          }

          // Find the container holding the videos table (the one with a table that has the "addpos sortable" class).
          const videosContainer = subcontainers.find(sc => sc.querySelector('table.addpos.sortable'));
          if (videosContainer) {
            const videosTable = videosContainer.querySelector('table.addpos.sortable');
            if (videosTable) {
              videos = Array.from(videosTable.querySelectorAll('tbody tr')).map(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length < 4) return null;
                const videoCell = cells[0];
                const link = videoCell.querySelector('a');
                if (!link) return null;
                const href = link.getAttribute('href') || '';
                const videoId = href.replace(/^\.\.\/video\//, '').replace(/\.html$/, '');
                const title = link.textContent?.trim() || "";
                const isCollaboration = (videoCell.textContent?.trim() || "").startsWith('*');
                const viewsText = cells[1].textContent?.trim() || "";
                const dailyViewsText = cells[2].textContent?.trim() || "";
                const publishedStr = cells[3].textContent?.trim() || "";
                const publishedDate = new Date(publishedStr + '/01').toISOString();
                const views = parseInt(viewsText.replace(/,/g, '') || '0', 10);
                const dailyViews = parseInt(dailyViewsText.replace(/,/g, '') || '0', 10);
                return { title, videoId, views, dailyViews, publishedDate, isCollaboration };
              }).filter(item => item !== null).slice(0, 50);
            }
          } else {
            console.log("No videos container found.");
          }
        } else {
          console.log("No subcontainers found.");
        }

        console.log('Stats:', stats, 'Videos:', videos);
        return { stats, videos };
      });
      return result;
    }
  }
}