import {Injectable} from "@angular/core";
import {BedStatusChoropleth} from "../map/overlays/bedstatuschoropleth";
import { Observable, BehaviorSubject} from "rxjs";
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { BedType } from '../map/options/bed-type.enum';
import {TooltipService} from "./tooltip.service";
import { BedBackgroundOptions } from '../map/options/bed-background-options';
import { map, tap } from 'rxjs/operators';
import { QuantitativeDiviDevelopmentRepository } from '../repositories/quantitative-divi-development.respository';
import { QualitativeDiviDevelopmentRepository } from '../repositories/qualitative-divi-development.respository';
import { QualitativeTimedStatus } from '../repositories/types/in/qualitative-hospitals-development';
import { QualitativeColormapService } from './qualitative-colormap.service';
import { QuantitativeTimedStatus } from '../repositories/types/out/quantitative-timed-status';
import { QuantitativeColormapService } from './quantitative-colormap.service';

@Injectable({
  providedIn: "root"
})
export class BedChoroplethLayerService {

  public loading$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(
    private quantitativeDiviDevelopmentRepository: QuantitativeDiviDevelopmentRepository,
    private qualitativeDiviDevelopmentRepository: QualitativeDiviDevelopmentRepository,
    private quantitativeColorMapService: QuantitativeColormapService, 
    private qualitativeColorMapService: QualitativeColormapService, 
    private tooltipService: TooltipService
    ) {
  }

  public getQualitativeLayer(option: BedBackgroundOptions): Observable<BedStatusChoropleth<QualitativeTimedStatus>> {
    this.loading$.next(true);
    return this.qualitativeDiviDevelopmentRepository.getDiviDevelopmentForAggLevel(option.aggregationLevel)
    .pipe(
      map(data => {
        return new BedStatusChoropleth(
          this.getName(option.aggregationLevel, option.bedType), 
          data, 
          option.aggregationLevel, 
          option.bedType, 
          this.qualitativeColorMapService, 
          this.tooltipService,
        );
      }),
      tap(() => this.loading$.next(false))
    );
  }

  // public getQuantitativeLayer(option: BedBackgroundOptions): Observable<BedStatusChoropleth<QuantitativeTimedStatus>> {
  //   this.loading$.next(true);
  //   return this.quantitativeDiviDevelopmentRepository.getDiviDevelopmentForAggLevel(option.aggregationLevel)
  //   .pipe(
  //     map(data => {
  //       return new BedStatusChoropleth(
  //         this.getName(option.aggregationLevel, option.bedType), 
  //         data, 
  //         option.aggregationLevel, 
  //         option.bedType, 
  //         this.quantitativeColorMapService, 
  //         this.tooltipService
  //       );
  //     }),
  //     tap(() => this.loading$.next(false))
  //   );
  // }

  public getName(granularity: AggregationLevel, type: BedType) {
    return `Hospitals_${granularity}_${type}`;
  }
}
