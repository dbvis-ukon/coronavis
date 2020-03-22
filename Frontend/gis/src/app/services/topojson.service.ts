import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class TopoJsonService {

  constructor(private http: HttpClient) { }

  getTopoJsonGermany() {
    return this.http.get('/assets/topojson-germany.json');
  }

}
