import {Injectable, OnInit} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {DataService} from "./data.service";
import {environment} from "../../environments/environment";
import {HospitalLayer} from "../map/overlays/hospital";
import {AggregationLayer} from "../map/overlays/aggregations";
import {FeatureCollection} from "geojson";
import {BehaviorSubject} from "rxjs";
import {Layer} from "leaflet";

@Injectable({
  providedIn: "root"
})
export class HospitallayerService {
  private _layers = [];
  private layers = new BehaviorSubject<HospitalLayer[]>(this._layers);

  constructor(private http: HttpClient, private dataService: DataService) {
  }

  public getLayers(): BehaviorSubject<HospitalLayer[]> {
    console.log("getting layers");

    const url = `${environment.apiUrl}hospitals/`;
    const granularities = ["landkreise", "regierungsbezirke", "bundeslander"];

    const types = ["icu_low_state", "icu_high_state", "ecmo_state"];

    for (let granularity of granularities) {
      console.log("getting data for granularity", granularity);
      this.http.get<FeatureCollection>(url + granularity)
        .subscribe(data => {
          console.log(data);
          for (let type of types) {
            console.log("creating layers for type", type);
            const layer = new AggregationLayer(`Hospitals_${granularity}_${type}`, data, type);
            this._layers.push(layer);
            this.layers.next(this._layers);
          }
        })
    }
    return this.layers;
  }
}
