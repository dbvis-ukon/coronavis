import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FeatureCollection } from 'geojson';

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
    const url = 'http://localhost:5000/api/data/regierungsbezirke';
    return this.getFeatureCollection(url);
  }

  /**
   * Retrieves the Landkreise from the given api endpoint.
   */
  getLandkreise(): Observable<FeatureCollection> {
    const url = 'http://localhost:5000/api/data/landkreise';
    return this.getFeatureCollection(url);
  }

  /**
   * Retrieves the Landkreise from the given api endpoint.
   */
  getBardichte(): Observable<FeatureCollection> {
    const url = 'http://localhost:5000/api/data/bardichte';
    return this.http.post<FeatureCollection>(url, null, httpOptions);
  }

  /**
   * Retrieves the Landkreise from the given api endpoint.
   */
  getAverageBardichte(): Observable<FeatureCollection> {
    const url = 'http://localhost:5000/api/data/averagebardichte';
    return this.http.post<FeatureCollection>(url, null, httpOptions);
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
