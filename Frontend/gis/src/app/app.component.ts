import { Component } from '@angular/core';
import { FeatureCollection } from 'geojson';
import { Overlay } from './map/overlays/overlay';
import { AggregationLevel } from './map/map.component';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {

  overlays: Array<Overlay<FeatureCollection>> = new Array<Overlay<FeatureCollection>>();

  aggregationLevel: AggregationLevel = AggregationLevel.none;

  showOsmHospitals: boolean = false;

  showOsmHeliports: boolean = false;

  // constructor is here only used to inject services
  constructor() { }
}
