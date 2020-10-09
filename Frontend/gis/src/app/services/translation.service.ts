import { Injectable } from '@angular/core';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { BedType } from '../map/options/bed-type.enum';
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
    // Abbreviations of capacity stati
    // Verfügbar
    {
      'de-DE': 'V',
      'en-US': 'A​' // This is 'a<zero-width space>', otherwise 'A' won't translate to 'F' for 'Ausgelastet'
    },
    // Begrenzt
    {
      'de-DE': 'B',
      'en-US': 'L'
    },
    // Ausgelasted
    {
      'de-DE': 'A',
      'en-US': 'F'
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
    },
    {
      'de-DE': 'Impressum',
      'en-US': 'Imprint'
    },
    {
      aggLevel: AggregationLevel.county,
      'de-DE': 'Landkreise',
      'en-US': 'Counties'
    },
    {
      aggLevel: AggregationLevel.governmentDistrict,
      'de-DE': 'Regierungsbezirke',
      'en-US': 'Districts'
    },
    {
      aggLevel: AggregationLevel.state,
      'de-DE': 'Bundesländer',
      'en-US': 'States'
    },
    {
      aggLevel: AggregationLevel.country,
      'de-DE': 'Deutschland',
      'en-US': 'Germany'
    },
    {
      bedType: BedType.icuLow,
      'de-DE': 'ICU low',
      'en-US': 'ICU low'
    },
    {
      bedType: BedType.icuHigh,
      'de-DE': 'ICU high',
      'en-US': 'ICU high'
    },
    {
      bedType: BedType.ecmo,
      'de-DE': 'ECMO',
      'en-US': 'ECMO'
    },
  ];

  constructor(
    private i18nService: I18nService
  ) { }


  public translate(input: string): string {
    const l = this.i18nService.getCurrentLocale();

    for (const t of this.TRANSLATIONS) {

      for (const v of Object.values(t)) {
        if (v === input.trim()) {

          return t[l];
        }
      }

    }

    console.warn('Could not find a translation for ' + input);
    return input;
  }
}
