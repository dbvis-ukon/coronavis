import {Injectable} from "@angular/core";
import {BedStatusChoropleth} from "../map/overlays/bedstatuschoropleth";
import { Observable, BehaviorSubject} from "rxjs";
import {QuantitativeColormapService} from "./quantiataive-colormap.service";
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { BedType } from '../map/options/bed-type.enum';
import {TooltipService} from "./tooltip.service";
import { BedBackgroundOptions } from '../map/options/bed-background-options';
import { map, tap } from 'rxjs/operators';
import { QuantitativeDiviDevelopmentRepository } from '../repositories/quantitative-divi-development.respository';
import { QualitativeDiviDevelopmentRepository } from '../repositories/qualitative-divi-development.respository';

@Injectable({
  providedIn: "root"
})
export class BedChoroplethLayerService {

  public loading$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(
    private quantitativeDiviDevelopmentRepository: QuantitativeDiviDevelopmentRepository,
    private qualitativeDiviDevelopmentRepository: QualitativeDiviDevelopmentRepository,
    private colormapService: QuantitativeColormapService, 
    private tooltipService: TooltipService
    ) {
  }

  public getQualitativeLayer(option: BedBackgroundOptions): Observable<BedStatusChoropleth> {
    this.loading$.next(true);
    return this.qualitativeDiviDevelopmentRepository.getDiviDevelopmentForAggLevel(option.aggregationLevel)
    .pipe(
      tap(() => console.log('load bed background choropleth layer')),
      map(data => {
        return new BedStatusChoropleth(
          this.getName(option.aggregationLevel, option.bedType), 
          data, 
          option.aggregationLevel, 
          option.bedType, 
          this.colormapService, 
          this.tooltipService
        );
      }),
      tap(() => this.loading$.next(false))
    );
  }

  public getQuantitativeLayer(option: BedBackgroundOptions): Observable<BedStatusChoropleth> {
    this.loading$.next(true);
    return this.quantitativeDiviDevelopmentRepository.getDiviDevelopmentForAggLevel(option.aggregationLevel)
    .pipe(
      tap(() => console.log('load bed background choropleth layer')),
      map(data => {
        return new BedStatusChoropleth(
          this.getName(option.aggregationLevel, option.bedType), 
          data, 
          option.aggregationLevel, 
          option.bedType, 
          this.colormapService, 
          this.tooltipService
        );
      }),
      tap(() => this.loading$.next(false))
    );
  }

  public getName(granularity: AggregationLevel, type: BedType) {
    return `Hospitals_${granularity}_${type}`;
  }
}
