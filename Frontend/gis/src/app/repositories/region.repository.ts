import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Region } from './types/in/region';

@Injectable({
  providedIn: 'root'
})
export class RegionRepository {

  constructor(private http: HttpClient) {
  }

  getAll(): Observable<Region[]> {
    return this.http.get<Region[]>(`${environment.apiUrl}regions`);
  }
}
