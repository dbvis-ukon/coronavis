import { Inject, Injectable, LOCALE_ID } from '@angular/core';
import { FormatLocaleDefinition } from 'd3-format';
import { TimeLocaleDefinition } from 'd3-time-format';
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

  getSupportedLocales(): SupportedLocales[] {
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

  getD3FormatLocaleDefinition(specificLocale?: SupportedLocales): FormatLocaleDefinition {
    if (!specificLocale) {
      specificLocale = this.getCurrentLocale();
    }

    switch(specificLocale) {
      case SupportedLocales.DE_DE:
        return {
          decimal: ',',
          thousands: '.',
          grouping: [3],
          currency: ['', '\u00a0€']
        };

      case SupportedLocales.EN_US:
        return {
          decimal: '.',
          thousands: ',',
          grouping: [3],
          currency: ['$', '']
        };

      default:
        throw new Error(`Locale ${specificLocale} unknown`);
    }
  }

  getD3TimeLocaleDefinition(specificLocale?: SupportedLocales): TimeLocaleDefinition {
    if (!specificLocale) {
      specificLocale = this.getCurrentLocale();
    }

    switch(specificLocale) {
      case SupportedLocales.DE_DE:
        return {
          dateTime: '%A, der %e. %B %Y, %X',
          date: '%d.%m.%Y',
          time: '%H:%M:%S',
          periods: ['AM', 'PM'],
          days: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
          shortDays: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
          months: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
          shortMonths: ['Jan', 'Feb', 'Mrz', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
        };

      case SupportedLocales.EN_US:
        return {
          dateTime: '%x, %X',
          date: '%-m/%-d/%Y',
          time: '%-I:%M:%S %p',
          periods: ['AM', 'PM'],
          days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          shortDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
          shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        };

      default:
        throw new Error(`Locale ${specificLocale} unknown`);
    }
  }
}
