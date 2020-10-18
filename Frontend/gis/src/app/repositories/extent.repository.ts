import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CachedRepository } from './cached.repository';

@Injectable({
  providedIn: 'root'
})
export class ExtentRepository {

  constructor(private cachedRepository: CachedRepository) {
  }

  getExtent(): Observable<[string, string]> {
    return this.cachedRepository.get<[string, string]>(`${environment.apiUrl}extent`);
  }
}
