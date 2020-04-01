import { Injectable, Inject, LOCALE_ID } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { APP_LOCALE } from 'src/constants';

export enum SupportedLanguages {
  DE = 'de',
  EN = 'en'
}

@Injectable({
  providedIn: 'root'
})
export class I18nService {

  currentLocale$: BehaviorSubject<SupportedLanguages> = new BehaviorSubject(SupportedLanguages.EN);

  constructor(@Inject(LOCALE_ID) protected localeId: string) {}

  initI18n() {
    this.currentLocale$.subscribe(l => console.log('current locale:', l));

    const l = JSON.parse(localStorage.getItem(APP_LOCALE)) as SupportedLanguages;
    if(this.getSupportedLocales().indexOf(l) > -1) {

      // retrieve from local storage
      this.updateLocale(l);

    } else if(this.getSupportedLocales().indexOf(this.localeId as SupportedLanguages) > -1) {

      // retrieve through browser
      this.updateLocale(this.localeId as SupportedLanguages);

    }
  }

  getSupportedLocales() {
    return Object.values(SupportedLanguages);
  }

  getCurrentLocale(): SupportedLanguages {
    return this.currentLocale$.value;
  }

  currentLocale(): Observable<SupportedLanguages> {
    return this.currentLocale$.asObservable();
  }

  updateLocale(newLocale: SupportedLanguages) {
    localStorage.setItem(APP_LOCALE, JSON.stringify(newLocale));

    this.currentLocale$.next(newLocale);
  }
}
