import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { County } from './types/in/county';

@Injectable({
  providedIn: 'root'
})
export class CountyRepository {

  constructor(private http: HttpClient) {
  }

  get(): Observable<County[]> {
    return this.http.get<County[]>(`${environment.apiUrl}counties`);
  }
}
