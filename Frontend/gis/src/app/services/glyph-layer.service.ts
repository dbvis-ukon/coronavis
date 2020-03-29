import {
  Injectable
} from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { SimpleGlyphLayer } from '../map/overlays/simple-glyph.layer';
import { BedGlyphOptions } from '../map/options/bed-glyph-options';
import { map, tap } from 'rxjs/operators';
import { TooltipService } from './tooltip.service';
import { ColormapService } from './colormap.service';
import { MatDialog } from '@angular/material/dialog';
import { HospitalRepository } from '../repositories/hospital.repository';
import { AggregatedGlyphLayer } from '../map/overlays/aggregated-glyph.layer';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { LandkreiseHospitalsLayer } from '../map/overlays/landkreishospitals';
import { LatLngLiteral, LayerGroup } from 'leaflet';
import { TimestampedValue, SingleHospitals, AggregatedHospitals, DiviDevelopmentRepository } from '../repositories/divi-development.respository';

export interface BedStatusSummary {
  free: TimestampedValue[]
  full: TimestampedValue[]
  prognosis: TimestampedValue[]
  in24h: TimestampedValue[]
}

export interface AbstractDiviHospital {
  x?: number;
  y?: number;
  _x?: number;
  _y?: number;
  vx?: number;
  vy?: number;
}

export interface DiviHospital extends AbstractDiviHospital {
  ID: number;
  Name: string;
  City: string;
  Postcode: string;
  Address: string;
  'Webaddress': string;
  'Location': LatLngLiteral;
  'covid19_aktuell': TimestampedValue[];
  'covid19_beatmet': TimestampedValue[];
  'covid19_kumulativ': TimestampedValue[];
  'covid19_verstorben': TimestampedValue[];
  'ecmo_faelle_jahr': TimestampedValue[];

  'icu_ecmo_care_belegt': TimestampedValue[]; // Extrakorporale Membranoxygenierung --> https://bit.ly/3dnlpyb
  'icu_ecmo_care_einschaetzung': TimestampedValue[];
  'icu_ecmo_care_frei': TimestampedValue[];
  'icu_ecmo_care_in_24h': TimestampedValue[];
  icu_ecmo_summary: BedStatusSummary;

  'icu_high_care_belegt': TimestampedValue[];
  'icu_high_care_einschaetzung': TimestampedValue[];
  'icu_high_care_frei': TimestampedValue[];
  'icu_high_care_in_24h': TimestampedValue[];
  icu_high_summary: BedStatusSummary;

  'icu_low_care_belegt': TimestampedValue[];
  'icu_low_care_einschaetzung': TimestampedValue[];
  'icu_low_care_frei': TimestampedValue[];
  'icu_low_care_in_24h': TimestampedValue[];
  icu_low_summary: BedStatusSummary;

  helipad_nearby: boolean;
}

export interface DiviAggregatedHospital extends AbstractDiviHospital {
  'ID': number;
  'Name': string;
  'Location': LatLngLiteral;
  'covid19_aktuell': TimestampedValue[];
  'covid19_beatmet': TimestampedValue[];
  'covid19_kumulativ': TimestampedValue[];
  'covid19_verstorben': TimestampedValue[];
  'ecmo_faelle_jahr': TimestampedValue[];

  'icu_ecmo_care_belegt': TimestampedValue[]; // Extrakorporale Membranoxygenierung --> https://bit.ly/3dnlpyb
  'icu_ecmo_care_einschaetzung': TimestampedValue[];
  'icu_ecmo_care_frei': TimestampedValue[];
  'icu_ecmo_care_in_24h': TimestampedValue[];
  icu_ecmo_summary: BedStatusSummary;

  'icu_high_care_belegt': TimestampedValue[];
  'icu_high_care_einschaetzung': TimestampedValue[];
  'icu_high_care_frei': TimestampedValue[];
  'icu_high_care_in_24h': TimestampedValue[];
  icu_high_summary: BedStatusSummary;

  'icu_low_care_belegt': TimestampedValue[];
  'icu_low_care_einschaetzung': TimestampedValue[];
  'icu_low_care_frei': TimestampedValue[];
  'icu_low_care_in_24h': TimestampedValue[];
  icu_low_summary: BedStatusSummary;
}

@Injectable({
  providedIn: 'root'
})
export class GlyphLayerService {

  constructor(
    private diviDevelopmentRepository: DiviDevelopmentRepository,
    private hospitalRepository: HospitalRepository,
    private tooltipService: TooltipService,
    private colormapService: ColormapService,
    private matDialog: MatDialog
  ) {}

  getSimpleGlyphLayer(options: Observable<BedGlyphOptions>): Observable<SimpleGlyphLayer> {
    return this.diviDevelopmentRepository.getDiviDevelopmentSingleHospitals()
    .pipe(
      tap(() => console.log('load simple glyph layer')),
      map(this.mySingleAggregatedMapper),
      map(divi => {
        return new SimpleGlyphLayer(
          'ho_none',
          divi,
          this.tooltipService,
          this.colormapService,
          options,
          this.matDialog
          );
      })
    );
  }

  getAggregatedGlyphLayer(aggLevel: AggregationLevel, options: Observable<BedGlyphOptions>): Observable<[AggregatedGlyphLayer, LandkreiseHospitalsLayer]> {
    return forkJoin([
      this.diviDevelopmentRepository.getDiviDevelopmentForAggLevel(aggLevel),
      this.hospitalRepository.getHospitalsForAggregationLevel(aggLevel)
    ])
    .pipe(
      tap(() => console.log('load aggregated glyph layer')),
      map(result => {
        const factory = new AggregatedGlyphLayer(
          'ho_glyph_'+aggLevel,
          aggLevel,
          this.myAggregatedMapper(result[0]),
          this.tooltipService,
          this.colormapService,
          options
        );
    
        const factoryBg = new LandkreiseHospitalsLayer(name + '_bg', result[1], this.tooltipService);
    
    
        // Create a layer group
        return [factory, factoryBg];
      })
    )
  }

  private mySingleAggregatedMapper(input: SingleHospitals): DiviHospital[] {
    return input.features.map((i, index) => {
      return {
        ID: +i.properties.id,
        Name: i.properties.name,
        Address: i.properties.address,
        Kontakt: i.properties.contact,
        City: i.properties.ort,
        Postcode: i.properties.plz,
        Webaddress: i.properties.webaddresse,
        Location: {
          lat: i.geometry.coordinates[1],
          lng: i.geometry.coordinates[0]
        },
        LastUpdate: new Date(),
        covid19_aktuell: i.properties.covid19_aktuell,
        covid19_beatmet: i.properties.covid19_beatmet,
        covid19_kumulativ: i.properties.covid19_kumulativ,
        covid19_verstorben: i.properties.covid19_verstorben,
        ecmo_faelle_jahr: i.properties.ecmo_faelle_jahr,

        icu_ecmo_care_belegt: i.properties.icu_ecmo_care_belegt,
        icu_ecmo_care_einschaetzung: i.properties.icu_ecmo_care_einschaetzung,
        icu_ecmo_care_frei: i.properties.icu_ecmo_care_frei,
        icu_ecmo_care_in_24h: i.properties.icu_ecmo_care_in_24h,
        icu_ecmo_summary: {free: i.properties.icu_ecmo_care_frei, full: i.properties.icu_ecmo_care_belegt, prognosis: i.properties.icu_ecmo_care_einschaetzung, in24h: i.properties.icu_ecmo_care_in_24h} as BedStatusSummary,

        icu_high_care_belegt: i.properties.icu_high_care_belegt,
        icu_high_care_einschaetzung: i.properties.icu_high_care_einschaetzung,
        icu_high_care_frei: i.properties.icu_high_care_frei,
        icu_high_care_in_24h: i.properties.icu_high_care_in_24h,
        icu_high_summary: {free: i.properties.icu_high_care_frei, full: i.properties.icu_high_care_belegt, prognosis: i.properties.icu_high_care_einschaetzung, in24h: i.properties.icu_high_care_in_24h} as BedStatusSummary,

        icu_low_care_belegt: i.properties.icu_low_care_belegt,
        icu_low_care_einschaetzung: i.properties.icu_low_care_einschaetzung,
        icu_low_care_frei: i.properties.icu_low_care_frei,
        icu_low_care_in_24h: i.properties.icu_low_care_in_24h,
        icu_low_summary: {free: i.properties.icu_low_care_frei, full: i.properties.icu_low_care_belegt, prognosis: i.properties.icu_low_care_einschaetzung, in24h: i.properties.icu_low_care_in_24h } as BedStatusSummary,

        helipad_nearby: i.properties.helipad_nearby
      } as DiviHospital;
    });
  }

  private myAggregatedMapper(input: AggregatedHospitals): DiviAggregatedHospital[] {
    return input.features.map((i, index) => {
      return {
        ID: index,
        Name: i.properties.name,
        Location: {
          lat: i.properties.centroid.coordinates[1],
          lng: i.properties.centroid.coordinates[0]
        },
        covid19_aktuell: i.properties.covid19_aktuell,
        covid19_beatmet: i.properties.covid19_beatmet,
        covid19_kumulativ: i.properties.covid19_kumulativ,
        covid19_verstorben: i.properties.covid19_verstorben,
        ecmo_faelle_jahr: i.properties.ecmo_faelle_jahr,
        icu_ecmo_care_belegt: i.properties.icu_ecmo_care_belegt,
        icu_ecmo_care_einschaetzung: i.properties.icu_ecmo_care_einschaetzung,
        icu_ecmo_care_frei: i.properties.icu_ecmo_care_frei,
        icu_ecmo_care_in_24h: i.properties.icu_ecmo_care_in_24h,
        icu_high_care_belegt: i.properties.icu_high_care_belegt,
        icu_high_care_einschaetzung: i.properties.icu_high_care_einschaetzung,
        icu_high_care_frei: i.properties.icu_high_care_frei,
        icu_high_care_in_24h: i.properties.icu_high_care_in_24h,
        icu_low_care_belegt: i.properties.icu_low_care_belegt,
        icu_low_care_einschaetzung: i.properties.icu_low_care_einschaetzung,
        icu_low_care_frei: i.properties.icu_low_care_frei,
        icu_low_care_in_24h: i.properties.icu_low_care_in_24h,
      } as DiviAggregatedHospital;
    });
  }
}
