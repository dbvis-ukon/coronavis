import { Injectable } from '@angular/core';
import { Feature } from 'geojson';
import { LatLngLiteral } from 'leaflet';

export interface ExplicitBBox {
  min: LatLngLiteral;

  max: LatLngLiteral;
}

@Injectable({
  providedIn: 'root'
})
export class GeojsonUtilService {

  constructor() { }


  public getBBox<T extends Feature>(fs: T[], latAcc: (d: T) => number, lngAcc: (d: T) => number): ExplicitBBox {
    const bbox: ExplicitBBox = {
      min: {
        lat: 1000,
        lng: 1000
      },

      max: {
        lat: -1,
        lng: -1
      }
    };

    fs.forEach(f => {
      const lat = latAcc(f);
      const lng = lngAcc(f);

      console.log(lat, lng, bbox);
      if(bbox.min.lat > lat) {
        bbox.min.lat = lat;
      }

      if(bbox.min.lng > lng) {
        bbox.min.lng = lng;
      }

      if(bbox.max.lat < lat) {
        bbox.max.lat = lat;
      }

      if(bbox.max.lng < lng) {
        bbox.max.lng = lng;
      }
    });

    return bbox;
  }
}
