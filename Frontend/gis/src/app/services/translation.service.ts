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
      'de-DE': 'Datenschutzerklärung',
      'en-US': 'Data-Privacy'
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
    {
      'de-DE': 'Covid-19 Patienten',
      'en-US': 'Covid-19 patients'
    },
    {
      'de-DE': 'Positiv getestete',
      'en-US': 'Tested positive'
    },
    {
      'de-DE': 'nach Altersgruppen',
      'en-US': 'by age groups'
    },
    {
      'de-DE': 'innerhalb',
      'en-US': 'within'
    },
    {
      'de-DE': '7 Tage',
      'en-US': '7 days'
    },
    {
      'de-DE': 'pro 100k Einwohner',
      'en-US': 'per 100k residents'
    },
    {
      'de-DE': 'für',
      'en-US': 'for'
    },
    {
      'de-DE': 'Bettenauslastung (%)',
      'en-US': 'Bed occupancy (%)'
    },
    {
      'de-DE': 'Positiv Getestet',
      'en-US': 'Tested positive'
    },
    {
      'de-DE': 'Todesfälle',
      'en-US': 'Deaths'
    },
    {
      'de-DE': 'Covid-19 Patienten (beatmet)',
      'en-US': 'Covid-19 patients (ventilated)'
    },
    {
      'de-DE': 'Bettenauslastung',
      'en-US': 'Bed occupancy'
    },
    {
      'de-DE': '/100k',
      'en-US': '/100k',
    },
    {
      'de-DE': '7T',
      'en-US': '7d'
    },
    {
      'de-DE': 'Datum',
      'en-US': 'Date'
    },
    {
      'de-DE': 'Betten',
      'en-US': 'beds'
    },
    {
      'de-DE': 'belegt',
      'en-US': 'occupied'
    },
    {
      'de-DE': 'gesamt',
      'en-US': 'total'
    },
    {
      system: '#autodashboard',
      'en-US': `# Auto-generated dashboard

This is an automatically generated dashboard based on %name%. Feel free to modify anything here.
If you save this dashboard, it will receive a new ID and URL.

> With :heart: from [@dbvis](https://twitter.com/dbvis)`,
      'de-DE': `# Automatisch generiertes Dashboard

Dies ist ein automatisch generiertes Dashboard für %name%. Du kannst dieses Dashboard modifizieren und speichern.
Wenn du das Dashboard speicherst, erhält es eine neue ID und URL.

> Mit :heart: von [@dbvis](https://twitter.com/dbvis)`
    },
    {
      system: '#dashboard404',
      'en-US': `# We could not find this dashboard

We could not find the dashboard you are looking for. You can search again or start here and add some more charts.
When you save, the dashboard will receive a new ID and URL.
You can also have a look at https://coronavis.dbvis.de/overview/dashboards to search for your dashboard.

> With :heart: from [@dbvis](https://twitter.com/dbvis)`,
      'de-DE': `# Wir konnten dieses Dashboard nicht finden

Wir konnten das Dashboard, welches du suchst, leider nicht finden.
Du kannst zu diesem Dashboard Charts hinzufügen und speichern um eine neue ID & URL zu generieren, oder du suchst das Dashboard
erneut unter https://coronavis.dbvis.de/overview/dashboards.

> Mit :heart: von [@dbvis](https://twitter.com/dbvis)`,
    }
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
