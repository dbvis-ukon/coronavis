import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Item } from '../services/chart.service';
import { Dashboard } from './types/in/dashboard';

@Injectable({
  providedIn: 'root'
})
export class DashboardRepository {

  constructor(private http: HttpClient) {
  }

  get(id: string): Observable<Dashboard> {
    return this.http.get<Dashboard>(`${environment.apiUrl}dashboards/${id}`);
  }

  save(ds: {title: string; items: Item[]}): Observable<Dashboard> {
    return this.http.post<Dashboard>(`${environment.apiUrl}dashboards`, ds);
  }

  upvote(id: string): Observable<Dashboard> {
    return this.http.post<Dashboard>(`${environment.apiUrl}dashboards/${id}/upvote`, null);
  }

  getNewest(): Observable<Dashboard[]> {
    return this.http.get<Dashboard[]>(`${environment.apiUrl}dashboards/newest`);
  }

  getMostVisited(): Observable<Dashboard[]> {
    return this.http.get<Dashboard[]>(`${environment.apiUrl}dashboards/most-visited`);
  }

  getMostUpvoted(): Observable<Dashboard[]> {
    return this.http.get<Dashboard[]>(`${environment.apiUrl}dashboards/most-upvoted`);
  }

  getHistory(id: string): Observable<Dashboard[]> {
    return this.http.get<Dashboard[]>(`${environment.apiUrl}dashboards/${id}/history`);
  }
}
