import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Feature, FeatureCollection, Point } from 'geojson';
import { LocalStorageService } from 'ngx-webstorage';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { BedGlyphOptions } from '../map/options/bed-glyph-options';
import { AggregatedGlyphLayer } from '../map/overlays/aggregated-glyph.layer';
import { LandkreiseHospitalsLayer } from '../map/overlays/landkreishospitals';
import { SimpleGlyphLayer } from '../map/overlays/simple-glyph.layer';
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
        const filteredFeatures: Feature<Point, SingleHospitalOut<QualitativeTimedStatus>>[] = [];

        for(const f of data.features) {
          if(f.geometry.coordinates[0] === 0 || f.geometry.coordinates[1] === 0 || f.geometry.coordinates[0] > 500 || f.geometry.coordinates[1] > 500) {
            console.warn(`Invalid location for hospital ${f.properties.name}. Will not be shown on the map.`, f);
          } else {
            filteredFeatures.push(f);
          }
        }
        
        return {
          type: 'FeatureCollection',
          features: filteredFeatures
        } as FeatureCollection<Point, SingleHospitalOut<QualitativeTimedStatus>>
      }),
      map(data => {
        const bbox = this.geojsonUtil.getBBox<Feature<Point, SingleHospitalOut<QualitativeTimedStatus>>>(data.features,
          d => d.geometry.coordinates[1],
          d => d.geometry.coordinates[0]);

        const quadrantBBoxes: ExplicitBBox[] = [];
        const numOfQuadrants = 4;
        const sqrtNum = Math.sqrt(numOfQuadrants);

        const latStep = (bbox.max.lat - bbox.min.lat) / sqrtNum;
        const lngStep = (bbox.max.lng - bbox.min.lng) / sqrtNum;

        for(let i = 0; i < sqrtNum; i++) {
          for(let j = 0; j < sqrtNum; j++) {
            quadrantBBoxes.push({
              min: {
                lat: bbox.min.lat + (i * latStep),
                lng: bbox.min.lng + (j * lngStep),
              },
  
              // calculation like this to prevent rounding erros
              max: {
                lat: bbox.max.lat - ((sqrtNum - i - 1) * latStep),
                lng: bbox.max.lng - ((sqrtNum - j - 1) * lngStep)
              }
            });
          }
        }

        const quadrants: FeatureCollection<Point, SingleHospitalOut<QualitativeTimedStatus>>[] = [...Array(numOfQuadrants)];

        for(const feature of data.features) {
          let found = false;

          for(let i = 0; i < numOfQuadrants; i++) {

            if(this.geojsonUtil.isFeatureInBBox(
              feature,
              d => d.geometry.coordinates[1],
              d => d.geometry.coordinates[0],
              quadrantBBoxes[i]
            )) {

              if(!quadrants[i]) {
                quadrants[i] = {
                  type: 'FeatureCollection',
                  features: []
                };
              }

              quadrants[i].features.push(feature);

              found = true;
              break;

            }
          }

          if(!found) {
            console.error('Could not allocate quadrant for feature', feature);
            throw `Runtime Exception: Could not be allocated to a quadrant`;
          }
        }

        return quadrants;
      }),
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
    return this.diviDevelopmentRepository.getDiviDevelopmentForAggLevel(aggLevel)
    .pipe(
      map(result => {
        const factory = new AggregatedGlyphLayer(
          'ho_glyph_'+aggLevel,
          aggLevel,
          result,
          this.tooltipService,
          this.colormapService,
          options.forceDirectedOn,
          options$,
          this.matDialog,
          this.storage
        );

        const factoryBg = new LandkreiseHospitalsLayer(name + '_bg', result);


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
