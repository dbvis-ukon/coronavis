import {Injectable} from '@angular/core';
import {BehaviorSubject, forkJoin, Observable} from 'rxjs';
import {SimpleGlyphLayer} from '../map/overlays/simple-glyph.layer';
import {BedGlyphOptions} from '../map/options/bed-glyph-options';
import {map, tap} from 'rxjs/operators';
import {TooltipService} from './tooltip.service';
import {MatDialog} from '@angular/material/dialog';
import {HospitalRepository} from '../repositories/hospital.repository';
import {AggregatedGlyphLayer} from '../map/overlays/aggregated-glyph.layer';
import {AggregationLevel} from '../map/options/aggregation-level.enum';
import {LandkreiseHospitalsLayer} from '../map/overlays/landkreishospitals';
import { QualitativeDiviDevelopmentRepository } from '../repositories/qualitative-divi-development.respository';
import { QualitativeColormapService } from './qualitative-colormap.service';

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
    private matDialog: MatDialog
  ) {}

  getSimpleGlyphLayer(options: Observable<BedGlyphOptions>, forceEnabled: boolean): Observable<SimpleGlyphLayer> {
    this.loading$.next(true);
    return this.diviDevelopmentRepository.getDiviDevelopmentSingleHospitals()
    .pipe(
      // map(this.mySingleAggregatedMapper),
      map(divi => {
        return new SimpleGlyphLayer(
          'ho_none',
          divi,
          this.tooltipService,
          this.colormapService,
          forceEnabled,
          options,
          this.matDialog
          );
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
          this.matDialog
        );

        const factoryBg = new LandkreiseHospitalsLayer(name + '_bg', result[1], this.tooltipService);


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
