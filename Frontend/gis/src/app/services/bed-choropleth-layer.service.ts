import { Injectable } from "@angular/core";
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Observable } from "rxjs";
import { map, tap } from 'rxjs/operators';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { BedBackgroundOptions } from '../map/options/bed-background-options';
import { BedType } from '../map/options/bed-type.enum';
import { BedStatusChoropleth } from "../map/overlays/bedstatuschoropleth";
import { QualitativeDiviDevelopmentRepository } from '../repositories/qualitative-divi-development.respository';
import { QuantitativeDiviDevelopmentRepository } from '../repositories/quantitative-divi-development.respository';
import { QualitativeTimedStatus } from '../repositories/types/in/qualitative-hospitals-development';
import { QualitativeColormapService } from './qualitative-colormap.service';
import { QuantitativeColormapService } from './quantitative-colormap.service';
import { TooltipService } from "./tooltip.service";

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
    private tooltipService: TooltipService,
    private matDialog: MatDialog
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
          this.matDialog
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
