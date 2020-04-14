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
      return this.http.get<T>(url)
      .pipe(
        tap(data => this.cache.set(url, data)),
      );
    }
  }
}
