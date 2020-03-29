import {Injectable} from "@angular/core";
import {BedStatusChoropleth} from "../map/overlays/bedstatuschoropleth";
import { Observable} from "rxjs";
import {ColormapService} from "./colormap.service";
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { BedType } from '../map/options/bed-type.enum';
import {TooltipService} from "./tooltip.service";
import { DiviDevelopmentRepository } from '../repositories/divi-development.respository';
import { BedBackgroundOptions } from '../map/options/bed-background-options';
import { map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: "root"
})
export class BedChoroplethLayerService {



  constructor(private diviDevelopmentRepository: DiviDevelopmentRepository, private colormapService: ColormapService, private tooltipService: TooltipService) {
  }

  public getLayer(option: BedBackgroundOptions): Observable<BedStatusChoropleth> {
    return this.diviDevelopmentRepository.getDiviDevelopmentForAggLevel(option.aggregationLevel)
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
      })
    );
  }

  public getName(granularity: AggregationLevel, type: BedType) {
    return `Hospitals_${granularity}_${type}`;
  }
}
