import {Injectable, OnInit} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {DataService} from "./data.service";
import {environment} from "../../environments/environment";
import {HospitalLayer} from "../map/overlays/hospital";
import {ChoroplethLayer} from "../map/overlays/choropleth";
import {FeatureCollection} from "geojson";
import {BehaviorSubject, Subject} from "rxjs";
import {Layer} from "leaflet";
import {ColormapService} from "./colormap.service";
import {AggregatedHospitals} from "./divi-hospitals.service";

@Injectable({
  providedIn: "root"
})
export class HospitallayerService {
  private _layers = [];
  private layers = new Subject<ChoroplethLayer>();

  constructor(private http: HttpClient, private dataService: DataService, private colormapService: ColormapService) {
  }

  public getLayers(): Subject<ChoroplethLayer> {
    console.log("getting layers");

    const url = `${environment.apiUrl}hospitals/`;
    const granularities = ["landkreise", "regierungsbezirke", "bundeslander"];

    const types = ["icu_low_state", "icu_high_state", "ecmo_state"];

    for (let granularity of granularities) {
      console.log("getting data for granularity", granularity);
      this.http.get<AggregatedHospitals>(url + granularity)
        .subscribe(data => {
          console.log(data);
          for (let type of types) {
            console.log("creating layers for type", type);
            const layer = new ChoroplethLayer(this.getName(granularity, type), data, type, this.colormapService);
            this.layers.next(layer);
          }
        })
    }
    return this.layers;
  }

  public getName(granularity: String, type: String) {
    return `Hospitals_${granularity}_${type}`;
  }
}
