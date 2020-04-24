import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BehaviorSubject, NEVER, Observable } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class IconService {

  public twitterLoaded$ = new BehaviorSubject<boolean>(false);
  public githubLoaded$ = new BehaviorSubject<boolean>(false);

  constructor(
    private iconRegistry: MatIconRegistry,
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {
    this.registerIcons();
  }

  private registerIcons() {
    
    this.getSvg(`assets/twitter.svg`)
    .subscribe(svg => {
      this.iconRegistry.addSvgIconLiteral('twitter', svg);
      this.twitterLoaded$.next(true);
    });

    this.getSvg(`assets/github.svg`)
    .subscribe(svg => {
      this.iconRegistry.addSvgIconLiteral('github', svg);
      this.githubLoaded$.next(true);
    });
  }


  private getSvg(url: string): Observable<SafeHtml> {
    const headers = new HttpHeaders();
    headers.set('Accept', 'image/svg+xml');
    
    return this.http.get(`${url}`, { headers, responseType: 'text'})
    .pipe(
      retry(1),
      catchError((error: HttpErrorResponse) => {
        let errorMessage = '';
        if (error.error instanceof ErrorEvent) {
          // client-side error
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // server-side error
          errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
        }
        console.warn('could not load icon', errorMessage);
        return NEVER;
        // return throw(errorMessage);
      }),
      map(d => this.sanitizer.bypassSecurityTrustHtml(d))
    )
  }
}
