import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { EmailSubscription } from './types/in/email-subscription';

@Injectable({
  providedIn: 'root'
})
export class EmailSubscriptionRepository {

  constructor(private http: HttpClient) {
  }


  subscribe(data: EmailSubscription): Observable<EmailSubscription> {
    return this.http.post<EmailSubscription>(`${environment.apiUrl}sub`, data);
  }

  unsubscribe(id: number, token: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}sub/${id}/${token}`);
  }

  get(id: number, token: string): Observable<EmailSubscription> {
    return this.http.get<EmailSubscription>(`${environment.apiUrl}sub/${id}/${token}`);
  }

  update(id: number, token: string, data: EmailSubscription): Observable<EmailSubscription> {
    return this.http.patch<EmailSubscription>(`${environment.apiUrl}sub/${id}/${token}`, data);
  }
}
