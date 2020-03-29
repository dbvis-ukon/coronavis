import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {forkJoin, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {FeatureCollection} from 'geojson';
import {environment} from 'src/environments/environment';
import {AggregationLevel} from '../map/options/aggregation-level.enum';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class DataService {
  constructor(private http: HttpClient) {}

  /**
   * Retrieves the Regierungsbezirke from the given api endpoint.
   */
  getRegierungsBezirke(): Observable<FeatureCollection> {
    const url = `${environment.apiUrl}api/data/regierungsbezirke`;
    return this.getFeatureCollection(url);
  }

  /**
   * Retrieves the Landkreise from the given api endpoint.
   */
  getLandkreise(): Observable<FeatureCollection> {
    const url = `${environment.apiUrl}api/data/landkreise`;
    return this.getFeatureCollection(url);
  }

  /**
   * Retrieves the Landkreise from the given api endpoint.
   */
  getOSMHospitals(): Observable<FeatureCollection> {
    const url = `${environment.apiUrl}osm/hospitals`;
    return this.http.get<FeatureCollection>(url);
  }

  /**
   * Retrieves the Landkreise from the given api endpoint.
   */
  getOSHelipads(): Observable<FeatureCollection> {
    const url = `${environment.apiUrl}osm/nearby_helipads`;
    return this.http.get<FeatureCollection>(url);
  }

  /**
   * Retrieves the Landkreise from the given api endpoint.
   */
  getHospitalsLandkreise(): Observable<FeatureCollection> {
    const url = `${environment.apiUrl}hospitals/landkreise`;
    return this.http.get<FeatureCollection>(url);
  }

  /**
   * Retrieves the Landkreise from the given api endpoint.
   */
  getHospitalsRegierungsbezirke(): Observable<FeatureCollection> {
    const url = `${environment.apiUrl}hospitals/regierungsbezirke`;
    return this.http.get<FeatureCollection>(url);
  }

  /**
   * Retrieves the Landkreise from the given api endpoint.
   */
  getHospitalsBundeslaender(): Observable<FeatureCollection> {
    const url = `${environment.apiUrl}hospitals/bundeslander`;
    return this.http.get<FeatureCollection>(url);
  }

  /**
   * Retrieves the Landkreise from the given api endpoint.
   */
  getCasesLandkreise(): Observable<FeatureCollection> {
    const url = `${environment.apiUrl}cases/landkreise`;
    return this.http.get<FeatureCollection>(url);
  }

  /**
   * Retrieves the Landkreise from the given api endpoint.
   */
  getCaseData(agg: AggregationLevel): Observable<FeatureCollection> {
    const total = this.http.get<FeatureCollection>(`${environment.apiUrl}cases/${agg}/total`);
    const yesterday = this.http.get<FeatureCollection>(`${environment.apiUrl}cases/${agg}/yesterday`);
    const threedays = this.http.get<FeatureCollection>(`${environment.apiUrl}cases/${agg}/3daysbefore`);

    return forkJoin([total, yesterday, threedays])
      .pipe(
        map(e => {
          for (let i = 0; i < e[0].features.length; i++) {
            const last = e[0].features[i];
            const y = e[1].features[i];
            const t = e[2].features[i];

            last.properties.deaths = +last.properties.deaths;
            last.properties.cases = +last.properties.cases;
            last.properties.bevoelkerung = + last.properties.bevoelkerung;

            y.properties.deaths = +y.properties.deaths;
            y.properties.cases = +y.properties.cases;
            y.properties.bevoelkerung = + y.properties.bevoelkerung;

            t.properties.deaths = +t.properties.deaths;
            t.properties.cases = +t.properties.cases;
            t.properties.bevoelkerung = + t.properties.bevoelkerung;

            e[0].features[i].properties.combined = [last.properties, y.properties, t.properties]
          }
          return e[0];
        })
      )
  }

  /**
   * Retrieves the data and constructs a FeatureCollection object from the received data
   */
  private getFeatureCollection(url): Observable<FeatureCollection> {
    return this.http.get<any>(url).pipe(
      map(unparsed => {
        const f: FeatureCollection = {
          type: 'FeatureCollection',
          features: unparsed.map((u: any) => {
            return {
              type: 'Feature',
              geometry: u.geojson,
              properties: { osm_id: u.osm_id, name: u.name, area: u.area }
            };
          })
        };

        return f;
      })
    );
  }
}
