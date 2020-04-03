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

    const l = JSON.parse(localStorage.getItem(APP_LOCALE)) as SupportedLocales;
    if(this.getSupportedLocales().indexOf(l) > -1) {

      // retrieve from local storage
      this.updateLocale(l);

      return true;

    } else {
      const navL = navigator.language.slice(0, 2);


      for(const availableLocale of this.getSupportedLocales()) {
        if(availableLocale.slice(0, 2) === navL) {

          this.updateLocale(availableLocale);

          return true;
        }
      }

      this.updateLocale(SupportedLocales.EN_US);
    }
    return false;
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
