import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface InstagramReel {
  id: string;
  embedHtml: string;
  thumbnailUrl?: string;
  permalink?: string;
  caption?: string;
}

export interface InstagramOEmbedResponse {
  version: string;
  type: string;
  thumbnail_url: string;
  thumbnail_width: number;
  thumbnail_height: number;
  title: string;
  author_name: string;
  author_url: string;
  html: string;
  width: number;
  height: number;
  provider_name: string;
  provider_url: string;
}

@Injectable({
  providedIn: 'root'
})
export class InstagramService {
  // Instagram oEmbed endpoint
  private readonly oEmbedUrl = 'https://api.instagram.com/oembed';

  // List of Instagram Reel URLs to display
  // Replace these with your actual Instagram Reel URLs from the Construvasco account
  private readonly reelUrls: string[] = [
    // Example format: 'https://www.instagram.com/reel/ABC123xyz/'
    // Add your actual reel URLs here
  ];

  constructor(private http: HttpClient) {}

  /**
   * Fetch Instagram Reel embed data using oEmbed API
   * @param reelUrl - Full Instagram Reel URL
   */
  getReelEmbed(reelUrl: string): Observable<InstagramReel> {
    const url = `${this.oEmbedUrl}?url=${encodeURIComponent(reelUrl)}&omitscript=true`;
    
    return this.http.get<InstagramOEmbedResponse>(url).pipe(
      map((response) => ({
        id: this.extractReelId(reelUrl),
        embedHtml: response.html,
        thumbnailUrl: response.thumbnail_url,
        permalink: reelUrl,
        caption: response.title
      })),
      catchError((error) => {
        console.error('Error fetching Instagram Reel:', error);
        throw error;
      })
    );
  }

  /**
   * Fetch multiple Instagram Reels
   */
  getReels(urls?: string[]): Observable<InstagramReel[]> {
    const urlsToFetch = urls || this.reelUrls;
    
    if (urlsToFetch.length === 0) {
      return of([]);
    }

    // Fetch all reels in parallel using forkJoin
    const requests = urlsToFetch.map(url => 
      this.getReelEmbed(url).pipe(
        catchError(error => {
          console.error(`Error fetching reel ${url}:`, error);
          // Return empty object on error to continue with other reels
          return of({
            id: '',
            embedHtml: '',
            permalink: url
          } as InstagramReel);
        })
      )
    );
    
    return forkJoin(requests).pipe(
      map(reels => reels.filter(reel => reel.embedHtml !== '')) // Filter out failed requests
    );
  }

  /**
   * Extract Reel ID from URL
   */
  private extractReelId(url: string): string {
    const match = url.match(/\/reel\/([^\/\?]+)/);
    return match ? match[1] : '';
  }

  /**
   * Validate Instagram Reel URL
   */
  isValidReelUrl(url: string): boolean {
    return /instagram\.com\/reel\//.test(url);
  }

  /**
   * Set custom reel URLs (useful for dynamic configuration)
   */
  setReelUrls(urls: string[]): void {
    this.reelUrls.length = 0;
    this.reelUrls.push(...urls);
  }
}

