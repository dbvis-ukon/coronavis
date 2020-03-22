import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FeatureCollection } from 'geojson';
import { environment } from 'src/environments/environment';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private http: HttpClient) { }

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
   * Retrieves the data and constructs a FeatureCollection object from the received data
   */
  private getFeatureCollection(url): Observable<FeatureCollection> {
    return this.http.post<any>(url, null, httpOptions).pipe(map(unparsed => {

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
    }));
  }

}
