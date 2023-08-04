import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { BedGlyphOptions } from '../map/options/bed-glyph-options';
import { AggregatedGlyphCanvasLayer } from '../map/overlays/aggregated-glyph-canvas.layer';
import { LandkreiseHospitalsLayer } from '../map/overlays/landkreishospitals';
import { SingleGlyphCanvasLayer } from '../map/overlays/single-glyph-canvas.layer';
import { QualitativeDiviDevelopmentRepository } from '../repositories/qualitative-divi-development.respository';
import { MyLocalStorageService } from '../services/my-local-storage.service';
import { HospitalUtilService } from './hospital-util.service';
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
    private storage: MyLocalStorageService,
    private hospitalUtil: HospitalUtilService
  ) {}

  getSimpleGlyphLayer(options: BedGlyphOptions, options$: BehaviorSubject<BedGlyphOptions>): Observable<SingleGlyphCanvasLayer[]> {
    this.loading$.next(true);

    const [from, to] = this.hospitalUtil.getFromToTupleFromOptions(options);

    return this.diviDevelopmentRepository.getDiviDevelopmentSingleHospitals(from, to, false)
    .pipe(
      // map(data => {
      //   const filteredFeatures: Feature<Point, SingleHospitalOut<QualitativeTimedStatus>>[] = [];

      //   for(const f of data.features) {
      //     if(f.geometry.coordinates[0] === 0 || f.geometry.coordinates[1] === 0 || f.geometry.coordinates[0] > 500 || f.geometry.coordinates[1] > 500) {
      //       console.warn(`Invalid location for hospital ${f.properties.name}. Will not be shown on the map.`, f);
      //     } else {
      //       filteredFeatures.push(f);
      //     }
      //   }

      //   return {
      //     type: 'FeatureCollection',
      //     features: filteredFeatures
      //   } as FeatureCollection<Point, SingleHospitalOut<QualitativeTimedStatus>>
      // }),
      // map(data => {
      //   const bbox = this.geojsonUtil.getBBox<Feature<Point, SingleHospitalOut<QualitativeTimedStatus>>>(data.features,
      //     d => d.geometry.coordinates[1],
      //     d => d.geometry.coordinates[0]);

      //   const quadrantBBoxes: ExplicitBBox[] = [];
      //   const numOfQuadrants = 4;
      //   const sqrtNum = Math.sqrt(numOfQuadrants);

      //   const latStep = (bbox.max.lat - bbox.min.lat) / sqrtNum;
      //   const lngStep = (bbox.max.lng - bbox.min.lng) / sqrtNum;

      //   for(let i = 0; i < sqrtNum; i++) {
      //     for(let j = 0; j < sqrtNum; j++) {
      //       quadrantBBoxes.push({
      //         min: {
      //           lat: bbox.min.lat + (i * latStep),
      //           lng: bbox.min.lng + (j * lngStep),
      //         },

      //         // calculation like this to prevent rounding erros
      //         max: {
      //           lat: bbox.max.lat - ((sqrtNum - i - 1) * latStep),
      //           lng: bbox.max.lng - ((sqrtNum - j - 1) * lngStep)
      //         }
      //       });
      //     }
      //   }

      //   const quadrants: FeatureCollection<Point, SingleHospitalOut<QualitativeTimedStatus>>[] = [...Array(numOfQuadrants)];

      //   for(const feature of data.features) {
      //     let found = false;

      //     for(let i = 0; i < numOfQuadrants; i++) {

      //       if(this.geojsonUtil.isFeatureInBBox(
      //         feature,
      //         d => d.geometry.coordinates[1],
      //         d => d.geometry.coordinates[0],
      //         quadrantBBoxes[i]
      //       )) {

      //         if(!quadrants[i]) {
      //           quadrants[i] = {
      //             type: 'FeatureCollection',
      //             features: []
      //           };
      //         }

      //         quadrants[i].features.push(feature);

      //         found = true;
      //         break;

      //       }
      //     }

      //     if(!found) {
      //       console.error('Could not allocate quadrant for feature', feature);
      //       throw `Runtime Exception: Could not be allocated to a quadrant`;
      //     }
      //   }

      //   return quadrants;
      // }),
      map(divi => {
        const simpleGlyphLayerArr: SingleGlyphCanvasLayer[] = [];

        simpleGlyphLayerArr.push(new SingleGlyphCanvasLayer(
          'ho_none',
          divi,
          this.tooltipService,
          this.colormapService,
          options$,
          this.matDialog,
          this.storage
          ));

        return simpleGlyphLayerArr;
      }),
      tap(() => this.loading$.next(false))
    );
  }

  getAggregatedGlyphLayer(options: BedGlyphOptions, options$: BehaviorSubject<BedGlyphOptions>): Observable<[AggregatedGlyphCanvasLayer, LandkreiseHospitalsLayer]> {
    const aggLevel = options.aggregationLevel;
    this.loading$.next(true);
    const [from, to] = this.hospitalUtil.getFromToTupleFromOptions(options);
    return this.diviDevelopmentRepository.getDiviDevelopmentForAggLevel(aggLevel, from, to, false)
    .pipe(
      map(result => {
        const factory = new AggregatedGlyphCanvasLayer(
          'ho_glyph_' + aggLevel,
          result,
          aggLevel,
          this.tooltipService,
          this.colormapService,
          options$,
          this.matDialog,
          this.storage
        );

        const factoryBg = new LandkreiseHospitalsLayer(name + '_bg', result);


        // Create a layer group
        return [factory, factoryBg];
      }),
      tap<[AggregatedGlyphCanvasLayer, LandkreiseHospitalsLayer]>(() => this.loading$.next(false))
    );
  }
}
