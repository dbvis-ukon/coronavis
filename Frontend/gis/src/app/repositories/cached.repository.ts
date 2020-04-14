import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CachedRepository {

  private cache: Map<string, any> = new Map();

  constructor(private http: HttpClient) {}

  get<T>(url: string): Observable<T> {
    if(this.cache.has(url)) {
      return of(this.cache.get(url));
    } else {
      console.log('http request', url);
      return this.http.get<T>(url)
      .pipe(
        tap(d => console.log('write data into cache', url)),
        // tap(data => this.cache.set(url, data)),
        // tap(d => console.log('done', url))
      );
    }
  }
}
