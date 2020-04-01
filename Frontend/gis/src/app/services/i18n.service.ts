import { Injectable, Inject, LOCALE_ID } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { APP_LOCALE } from 'src/constants';

export enum SupportedLocales {
  DE_DE = 'de-DE',
  EN_US = 'en-US'
}

@Injectable({
  providedIn: 'root'
})
export class I18nService {

  currentLocale$: BehaviorSubject<SupportedLocales> = new BehaviorSubject(SupportedLocales.EN_US);

  constructor(@Inject(LOCALE_ID) protected localeId: string) {}

  initI18n() {
    this.currentLocale$.subscribe(l => console.log('current locale:', l));

    const l = JSON.parse(localStorage.getItem(APP_LOCALE)) as SupportedLocales;
    if(this.getSupportedLocales().indexOf(l) > -1) {

      // retrieve from local storage
      this.updateLocale(l);

    } else if(this.getSupportedLocales().indexOf(this.localeId as SupportedLocales) > -1) {

      // retrieve through browser
      this.updateLocale(this.localeId as SupportedLocales);

    }
  }

  getSupportedLocales() {
    return Object.values(SupportedLocales);
  }

  getCurrentLocale(): SupportedLocales {
    return this.currentLocale$.value;
  }

  currentLocale(): Observable<SupportedLocales> {
    return this.currentLocale$.asObservable();
  }

  updateLocale(newLocale: SupportedLocales) {
    localStorage.setItem(APP_LOCALE, JSON.stringify(newLocale));

    this.currentLocale$.next(newLocale);
  }
}
