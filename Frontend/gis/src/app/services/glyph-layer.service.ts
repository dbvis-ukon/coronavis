import {
  Injectable
} from '@angular/core';
import { Observable, forkJoin, BehaviorSubject } from 'rxjs';
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
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {LatLngLiteral} from 'leaflet';
import {environment} from 'src/environments/environment';
import {Feature, FeatureCollection, MultiPolygon} from 'geojson';
import {BedType} from "../map/options/bed-type.enum";

export interface HospitalProperties {
  name: string,
  covid19_aktuell: TimestampedValue[];
  covid19_beatmet: TimestampedValue[];
  covid19_kumulativ: TimestampedValue[];
  covid19_verstorben: TimestampedValue[];
  ecmo_faelle_jahr: TimestampedValue[];
  icu_ecmo_care_belegt: TimestampedValue[];
  icu_ecmo_care_einschaetzung: TimestampedValue[];
  icu_ecmo_care_frei: TimestampedValue[];
  icu_ecmo_care_in_24h: TimestampedValue[];
  icu_high_care_belegt: TimestampedValue[];
  icu_high_care_einschaetzung: TimestampedValue[];
  icu_high_care_frei: TimestampedValue[];
  icu_high_care_in_24h: TimestampedValue[];
  icu_low_care_belegt: TimestampedValue[];
  icu_low_care_einschaetzung: TimestampedValue[];
  icu_low_care_frei: TimestampedValue[];
  icu_low_care_in_24h: TimestampedValue[];
}

export interface SingleHospitalProperties extends HospitalProperties {
  gemeindeschluessel: number;
  ort: string;
  bundeslandschluessel: string;
  plz: string;
  webaddresse: string;
  id: string;
  address: string;
  state: string;
  contact: string;
  helipad_nearby: boolean;
}

export interface AggregatedHospitalsCentroid {
  coordinates: number[];
  type: string;
}

export interface AggregatedHospitalsProperties extends HospitalProperties {
  ids: string;
  centroid: AggregatedHospitalsCentroid;
}

export interface SingleHospitals extends FeatureCollection {
  features: SingleHospitalFeature[];
  type: 'FeatureCollection';
}

export interface SingleHospitalFeature {
  geometry: SingleHospitalGeometry;
  properties: SingleHospitalProperties;
  type: 'Feature';
}

export interface SingleHospitalGeometry {
  coordinates: number[];
  type: 'Point';
}


export interface AggregatedHospitalsGeometry extends MultiPolygon {
  coordinates: number[][][][];
  type: 'MultiPolygon';
}


export interface AggregatedHospitalsFeature extends Feature<AggregatedHospitalsGeometry, AggregatedHospitalsProperties> {
  geometry: AggregatedHospitalsGeometry;
  properties: AggregatedHospitalsProperties;
  type: 'Feature';
}

export interface AggregatedHospitals extends FeatureCollection {
  features: Array<AggregatedHospitalsFeature>;
  type: 'FeatureCollection';
}

export interface TimestampedValue {
  value: number;
  timestamp: Date;
}

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

  ID: number;
  Name: string;
  Location: LatLngLiteral;

  covid19_aktuell: TimestampedValue[];
  covid19_beatmet: TimestampedValue[];
  covid19_kumulativ: TimestampedValue[];
  covid19_verstorben: TimestampedValue[];
  ecmo_faelle_jahr: TimestampedValue[];

  icu_ecmo_care_belegt: TimestampedValue[]; // Extrakorporale Membranoxygenierung --> https://bit.ly/3dnlpyb
  icu_ecmo_care_einschaetzung: TimestampedValue[];
  icu_ecmo_care_frei: TimestampedValue[];
  icu_ecmo_care_in_24h: TimestampedValue[];
  icu_ecmo_summary: BedStatusSummary;

  icu_high_care_belegt: TimestampedValue[];
  icu_high_care_einschaetzung: TimestampedValue[];
  icu_high_care_frei: TimestampedValue[];
  icu_high_care_in_24h: TimestampedValue[];
  icu_high_summary: BedStatusSummary;

  icu_low_care_belegt: TimestampedValue[];
  icu_low_care_einschaetzung: TimestampedValue[];
  icu_low_care_frei: TimestampedValue[];
  icu_low_care_in_24h: TimestampedValue[];
  icu_low_summary: BedStatusSummary;
}

export interface DiviHospital extends AbstractDiviHospital {
  City: string;
  Postcode: string;
  Address: string;
  Webaddress: string;

  helipad_nearby: boolean;
}

export interface DiviAggregatedHospital extends AbstractDiviHospital {
}

@Injectable({
  providedIn: 'root'
})
export class GlyphLayerService {

  public loading$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(
    private diviDevelopmentRepository: DiviDevelopmentRepository,
    private hospitalRepository: HospitalRepository,
    private tooltipService: TooltipService,
    private colormapService: ColormapService,
    private matDialog: MatDialog
  ) {}

  getSimpleGlyphLayer(options: Observable<BedGlyphOptions>): Observable<SimpleGlyphLayer> {
    this.loading$.next(true);
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
      }),
      tap(() => this.loading$.next(false))
    );
  }

  getAggregatedGlyphLayer(aggLevel: AggregationLevel, options: Observable<BedGlyphOptions>): Observable<[AggregatedGlyphLayer, LandkreiseHospitalsLayer]> {
    this.loading$.next(true);
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
      }),
      tap<[AggregatedGlyphLayer, LandkreiseHospitalsLayer]>(() => this.loading$.next(false))
    )
  }

  private mySingleAggregatedMapper(input: SingleHospitals): DiviHospital[] {
    return input.features.map((i, index) => {
      return {
        Address: i.properties.address,
        Kontakt: i.properties.contact,
        City: i.properties.ort,
        Postcode: i.properties.plz,
        Webaddress: i.properties.webaddresse,

        helipad_nearby: i.properties.helipad_nearby,
        // TODO: where do we actually get a last updated value from?
        ID: +i.properties.id,
        Name: i.properties.name,
        Location: {
          lat: i.geometry.coordinates[1],
          lng: i.geometry.coordinates[0]
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
      } as DiviAggregatedHospital;
    });
  }
}

export function getLatest(entries: TimestampedValue[]) : number {
  // console.log(entries);
  if (entries === undefined) {
    return NaN;
  }
  if (entries.length === 0) {
    return NaN;
  }
  let currentEntry = entries[0];
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].timestamp > currentEntry.timestamp) {
      currentEntry = entries[i];
    }
  }
  return currentEntry.value;
}
