import {Injectable, OnInit} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {DataService} from "./data.service";
import {environment} from "../../environments/environment";
import {HospitalLayer} from "../map/overlays/hospital";
import {BedStatusChoropleth} from "../map/overlays/bedstatuschoropleth";
import {FeatureCollection} from "geojson";
import {BehaviorSubject, Subject} from "rxjs";
import {Layer} from "leaflet";
import {ColormapService} from "./colormap.service";
import {AggregatedHospitals} from "./divi-hospitals.service";
import { AggregationLevel } from '../map/options/aggregation-level';
import { GlyphState } from '../map/options/glyph-state';

@Injectable({
  providedIn: "root"
})
export class HospitallayerService {
  private _layers = [];
  private layers = new Subject<BedStatusChoropleth>();

  constructor(private http: HttpClient, private dataService: DataService, private colormapService: ColormapService) {
  }

  public getLayers(): Subject<BedStatusChoropleth> {

    const url = `${environment.apiUrl}hospitals/`;
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
        api: "bundeslander",
        state: AggregationLevel.state
      }];

    const types = Object.values(GlyphState).filter(i => GlyphState.none !== i);

    for (let granularity of granularities) {
      this.http.get<AggregatedHospitals>(url + granularity.api)
        .subscribe(data => {
          for (let type of types) {
            const layer = new BedStatusChoropleth(this.getName(granularity.state, type), data, granularity.state, type, this.colormapService);
            this.layers.next(layer);
          }
        })
    }
    return this.layers;
  }

  public getName(granularity: AggregationLevel, type: GlyphState) {
    return `Hospitals_${granularity}_${type}`;
  }
}
