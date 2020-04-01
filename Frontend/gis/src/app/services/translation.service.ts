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
      'en-US': 'Fully Occupied'
    },
    {
      'de-DE': 'Nicht verfügbar',
      'en-US': 'Unavailable'
    },
    {
      'de-DE': 'Keine Information',
      'en-US': 'No Information'
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
      'en-US': 'Reset to Default'
    },
    {
      'de-DE': 'ICU low care = Monitoring, nicht-invasive Beatmung (NIV), keine Organersatztherapie',
      'en-US': 'ICU low care = monitoring, non-invasive ventilation (NIV), no organ replacement therapy'
    },
    {
      'de-DE': 'ICU high care = Monitoring, invasive Beatmung, Organersatztherapie, vollständige intensivmedizinische Therapiemöglichkeiten',
      'en-US': 'ICU high care = monitoring, invasive ventilation, organ replacement therapy, complete intensive care medical therapy'
    },
    {
      'de-DE': 'ECMO = Zusätzlich ECMO',
      'en-US': 'ECMO = Additional ECMO'
    },
    {
      'de-DE': 'Anzahl Krankenhäuser',
      'en-US': 'Number of Hospitals'
    },
    {
      'de-DE': 'Anzahl KH',
      'en-US': '# Hospitals'
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
