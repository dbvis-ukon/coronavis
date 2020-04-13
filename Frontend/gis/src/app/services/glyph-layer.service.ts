import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Feature, FeatureCollection, Point } from 'geojson';
import { LatLngExpression } from 'leaflet';
import { LocalStorageService } from 'ngx-webstorage';
import { BehaviorSubject, forkJoin, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { BedGlyphOptions } from '../map/options/bed-glyph-options';
import { AggregatedGlyphLayer } from '../map/overlays/aggregated-glyph.layer';
import { LandkreiseHospitalsLayer } from '../map/overlays/landkreishospitals';
import { SimpleGlyphLayer } from '../map/overlays/simple-glyph.layer';
import { HospitalRepository } from '../repositories/hospital.repository';
import { QualitativeDiviDevelopmentRepository } from '../repositories/qualitative-divi-development.respository';
import { QualitativeTimedStatus } from '../repositories/types/in/qualitative-hospitals-development';
import { SingleHospitalOut } from '../repositories/types/out/single-hospital-out';
import { ExplicitBBox, GeojsonUtilService } from './geojson-util.service';
import { QualitativeColormapService } from './qualitative-colormap.service';
import { TooltipService } from './tooltip.service';

@Injectable({
  providedIn: 'root'
})
export class GlyphLayerService {

  public loading$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(
    private diviDevelopmentRepository: QualitativeDiviDevelopmentRepository,
    private hospitalRepository: HospitalRepository,
    private tooltipService: TooltipService,
    private colormapService: QualitativeColormapService,
    private matDialog: MatDialog,
    private storage: LocalStorageService,
    private geojsonUtil: GeojsonUtilService
  ) {}

  getSimpleGlyphLayer(options: Observable<BedGlyphOptions>, forceEnabled: boolean): Observable<SimpleGlyphLayer[]> {
    this.loading$.next(true);
    return this.diviDevelopmentRepository.getDiviDevelopmentSingleHospitals()
    .pipe(
      map(data => {
        const bbox = this.geojsonUtil.getBBox<Feature<Point, SingleHospitalOut<QualitativeTimedStatus>>>(data.features,
          d => d.geometry.coordinates[1],
          d => d.geometry.coordinates[0]);

        const quadrantBBoxes: ExplicitBBox[] = [];
        const latStep = (bbox.max.lat - bbox.min.lat) / 4;
        const lngStep = (bbox.max.lng - bbox.min.lng) / 4;

        for(let i = 0; i <= 4; i++) {
          quadrantBBoxes.push({
            min: {
              lat: bbox.min.lat + (i * latStep),
              lng: bbox.min.lng + (i * lngStep),
            },

            max: {
              lat: bbox.min.lat + ((i+1) * latStep),
              lng: bbox.min.lng + ((i+1) * lngStep)
            }
          });
        }

        console.log('bbox', bbox);
        console.log('quadrants', quadrantBBoxes);

        // map the data into four quadrants
        const gerCenter: LatLngExpression = {
          lat: 51.1069818075,
          lng: 10.385780508
        };

        // coordinates[0] === lng // coorinates[1] === lat
        const isQuadrant1 = (d: Feature<Point, any>) => d.geometry.coordinates[1] <= gerCenter.lat && d.geometry.coordinates[0] <= gerCenter.lng;
        const isQuadrant2 = (d: Feature<Point, any>) => d.geometry.coordinates[1] <= gerCenter.lat && d.geometry.coordinates[0] > gerCenter.lng;
        const isQuadrant3 = (d: Feature<Point, any>) => d.geometry.coordinates[1] > gerCenter.lat && d.geometry.coordinates[0] > gerCenter.lng;
        const isQuadrant4 = (d: Feature<Point, any>) => d.geometry.coordinates[1] > gerCenter.lat && d.geometry.coordinates[0] <= gerCenter.lng;

        const q1: FeatureCollection<Point, SingleHospitalOut<QualitativeTimedStatus>> = {
          type: 'FeatureCollection',
          features: []
        };
        const q2: FeatureCollection<Point, SingleHospitalOut<QualitativeTimedStatus>> = {
          type: 'FeatureCollection',
          features: []
        };
        const q3: FeatureCollection<Point, SingleHospitalOut<QualitativeTimedStatus>> = {
          type: 'FeatureCollection',
          features: []
        };
        const q4: FeatureCollection<Point, SingleHospitalOut<QualitativeTimedStatus>> = {
          type: 'FeatureCollection',
          features: []
        };

        for(const feature of data.features) {
          if(isQuadrant1(feature)) {
            q1.features.push(feature);
          } else if (isQuadrant2(feature)) {
            q2.features.push(feature);
          } else if (isQuadrant3(feature)) {
            q3.features.push(feature);
          } else if (isQuadrant4(feature)) {
            q4.features.push(feature);
          } else {
            throw 'This situation must never happen';
          }
        }

        return [q1, q2, q3, q4];
      }),
      // map(this.mySingleAggregatedMapper),
      map(divi => {
        const simpleGlyphLayerArr: SimpleGlyphLayer[] = [];

        for(const fc of divi) {
          simpleGlyphLayerArr.push(new SimpleGlyphLayer(
            'ho_none',
            fc,
            this.tooltipService,
            this.colormapService,
            forceEnabled,
            options,
            this.matDialog,
            this.storage
            ));
        }

        return simpleGlyphLayerArr;
      }),
      tap(() => this.loading$.next(false))
    );
  }

  getAggregatedGlyphLayer(options: BedGlyphOptions, options$: Observable<BedGlyphOptions>): Observable<[AggregatedGlyphLayer, LandkreiseHospitalsLayer]> {
    const aggLevel = options.aggregationLevel;
    this.loading$.next(true);
    return forkJoin([
      this.diviDevelopmentRepository.getDiviDevelopmentForAggLevel(aggLevel),
      this.hospitalRepository.getHospitalsForAggregationLevel(aggLevel)
    ])
    .pipe(
      map(result => {
        const factory = new AggregatedGlyphLayer(
          'ho_glyph_'+aggLevel,
          aggLevel,
          result[0],
          this.tooltipService,
          this.colormapService,
          options.forceDirectedOn,
          options$,
          this.matDialog,
          this.storage
        );

        const factoryBg = new LandkreiseHospitalsLayer(name + '_bg', result[1]);


        // Create a layer group
        return [factory, factoryBg];
      }),
      tap<[AggregatedGlyphLayer, LandkreiseHospitalsLayer]>(() => this.loading$.next(false))
    )
  }

  // private mySingleAggregatedMapper(input: FeatureCollection<Point, SingleHospitalOut<QualitativeTimedStatus>>): DiviHospital[] {
  //   return input.features.map(i => {
  //     const diviHospital: DiviHospital =  {
  //       ...i.properties,
  //       location: {
  //         lat: i.geometry.coordinates[1],
  //         lng: i.geometry.coordinates[0]
  //       },
  //       // icu_low_summary: {free: i.properties.icu_low_care_frei, full: i.properties.icu_low_care_belegt, prognosis: i.properties.icu_low_care_einschaetzung, in24h: i.properties.icu_low_care_in_24h } as BedStatusSummary,
  //       // icu_high_summary: {free: i.properties.icu_high_care_frei, full: i.properties.icu_high_care_belegt, prognosis: i.properties.icu_high_care_einschaetzung, in24h: i.properties.icu_high_care_in_24h} as BedStatusSummary,
  //       // icu_ecmo_summary: {free: i.properties.icu_ecmo_care_frei, full: i.properties.icu_ecmo_care_belegt, prognosis: i.properties.icu_ecmo_care_einschaetzung, in24h: i.properties.icu_ecmo_care_in_24h} as BedStatusSummary,
  //     };
  //     return diviHospital;
  //   });
  // }

  // private myAggregatedMapper(input: QuantitativeAggregatedHospitals): DiviAggregatedHospital[] {
  //   return input.features.map((i, index) => {
  //     const diviAggregatedHospital: DiviAggregatedHospital = {
  //       ...i.properties,
  //       location: {
  //         lat: i.properties.centroid.coordinates[1],
  //         lng: i.properties.centroid.coordinates[0]
  //       },
  //       icu_low_summary: {free: i.properties.icu_low_care_frei, full: i.properties.icu_low_care_belegt, prognosis: i.properties.icu_low_care_einschaetzung, in24h: i.properties.icu_low_care_in_24h } as BedStatusSummary,
  //       icu_high_summary: {free: i.properties.icu_high_care_frei, full: i.properties.icu_high_care_belegt, prognosis: i.properties.icu_high_care_einschaetzung, in24h: i.properties.icu_high_care_in_24h} as BedStatusSummary,
  //       icu_ecmo_summary: {free: i.properties.icu_ecmo_care_frei, full: i.properties.icu_ecmo_care_belegt, prognosis: i.properties.icu_ecmo_care_einschaetzung, in24h: i.properties.icu_ecmo_care_in_24h} as BedStatusSummary,
  //     };

  //     return diviAggregatedHospital;
  //   });
  // }
}
