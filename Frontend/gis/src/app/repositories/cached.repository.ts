import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CachedRepository {

  private cache: Map<string, any> = new Map();

  constructor(private http: HttpClient) {}

  empty() {
    this.cache.clear();
  }

  get<T>(url: string, params?: HttpParams): Observable<T> {

    const key = url + '?' + (params?.toString() || '');

    if (this.cache.has(key)) {
      return of(this.cache.get(key));
    } else {
      return this.http.get<T>(url, {params})
      .pipe(
        tap(data => this.cache.set(key, data))
      );
    }
  }
}
