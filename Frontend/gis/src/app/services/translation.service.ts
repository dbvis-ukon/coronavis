import { Injectable } from '@angular/core';
import { I18nService } from './i18n.service';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {

  private readonly TRANSLATIONS = [
    {
      'de-DE': 'Verfügbar',
      'en-US': 'Available',
    },
    {
      'de-DE': 'Begrenzt',
      'en-US': 'Limited'
    },
    {
      'de-DE': 'Ausgelastet',
      'en-US': 'Fully occupied'
    },
    {
      'de-DE': 'Nicht verfügbar',
      'en-US': 'Unavailable'
    },
    {
      'de-DE': 'Keine Information',
      'en-US': 'No information'
    },
    {
      'de-DE': 'Der Kartenausschnitt aus Ihrem letzten Besuch wurde wiederhergestellt',
      'en-US': 'The map from your last visit has been restored'
    },
    {
      'de-DE': 'Die Anwendungskonfiguration aus Ihrem letzten Besuch wurde wiederhergestellt',
      'en-US': 'The configuration from your last visit has been restored'
    },
    {
      'de-DE': 'Zurücksetzen',
      'en-US': 'Reset to default'
    }
  ];

  constructor(
    private i18nService: I18nService
  ) { }


  public translate(input: string): string {
    const l = this.i18nService.getCurrentLocale();

    for(const t of this.TRANSLATIONS) {

      for(const v of Object.values(t)) {
        if(v === input.trim()) {

          return t[l];
        }
      }

    }

    console.warn('Could not find a translation for ' + input);
    return input;
  }
}
