import { Pipe, PipeTransform, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

/**
 * SecureImagePipe
 * ---------------
 * Fetches an image through Angular's HttpClient (so the auth interceptor adds
 * the Bearer token) and returns an Observable<string> blob URL.
 *
 * Usage (always pair with async pipe — it handles subscription + change detection):
 *   <img [src]="file.file_url | secureImage | async" [alt]="file.file_name" />
 *
 * Also handles data: URLs transparently (AI-generated images) without fetching.
 */
@Pipe({
  name: 'secureImage',
  standalone: true,
  pure: true
})
export class SecureImagePipe implements PipeTransform {
  private _http = inject(HttpClient);

  transform(url: string | null | undefined): Observable<string | null> {
    if (!url) return of(null);

    // data: URLs are already inline — no HTTP request needed
    if (url.startsWith('data:')) return of(url);

    return this._http.get(url, { responseType: 'blob' }).pipe(
      map(blob => URL.createObjectURL(blob)),
      catchError(() => of(null))
    );
  }
}
