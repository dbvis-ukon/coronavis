import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {DataService} from "./data.service";
import {environment} from "../../environments/environment";
import {BedStatusChoropleth} from "../map/overlays/bedstatuschoropleth";
import {Subject} from "rxjs";
import {ColormapService} from "../services/colormap.service";
import {AggregatedHospitals} from "./divi-hospitals.service";
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { BedType } from '../map/options/bed-type.enum';
import {TooltipService} from "../services/tooltip.service";

@Injectable({
  providedIn: "root"
})
export class HospitallayerService {
  private _layers = [];
  private layers = new Subject<BedStatusChoropleth>();

  constructor(private http: HttpClient, private dataService: DataService, private colormapService: ColormapService, private tooltipService: TooltipService) {
  }

  public getLayers(): Subject<BedStatusChoropleth> {

    const url = `${environment.apiUrl}divi/development/`;
    const granularities = [
      {
        api: "landkreise",
        state: AggregationLevel.county,
      },
      {
        api: "regierungsbezirke",
        state: AggregationLevel.governmentDistrict
      },
      {
        api: "bundeslaender",
        state: AggregationLevel.state
      }];

    const types = Object.values(BedType);

    for (let granularity of granularities) {
      this.http.get<AggregatedHospitals>(url + granularity.api)
        .subscribe(data => {
          for (let type of types) {
            const layer = new BedStatusChoropleth(this.getName(granularity.state, type), data, granularity.state, type, this.colormapService, this.tooltipService);
            this.layers.next(layer);
          }
        })
    }
    return this.layers;
  }

  public getName(granularity: AggregationLevel, type: BedType) {
    return `Hospitals_${granularity}_${type}`;
  }
}
