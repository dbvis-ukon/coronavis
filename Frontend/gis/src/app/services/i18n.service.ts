import { Inject, Injectable, LOCALE_ID } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export enum SupportedLocales {
  DE_DE = 'de-DE',
  EN_US = 'en-US'
}

@Injectable({
  providedIn: 'root'
})
export class I18nService {

  currentLocale$: BehaviorSubject<SupportedLocales> = new BehaviorSubject(SupportedLocales.EN_US);

  constructor(@Inject(LOCALE_ID) protected localeId: string) {
    this.initI18n();
  }

  initI18n() {
    this.updateLocale(this.localeId as SupportedLocales);
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
    this.currentLocale$.next(newLocale);
  }
}
