import { Component, OnInit } from '@angular/core';
import { DataService } from './services/data.service';
import { FeatureCollection } from 'geojson';
import { Overlay } from './map/overlays/overlay';
import { LandkreisLayer } from './map/overlays/landkreis';
import { BardichteLayer } from './map/overlays/bardichte';
import { AverageBardichteLayer } from './map/overlays/avgbardichte';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  overlays: Array<Overlay> = new Array<Overlay>();

  // constructor is here only used to inject services
  constructor(private dataService: DataService) { }

  /**
   * Retrieve data from server and add it to the overlays arrays
   */
  ngOnInit(): void {
    this.dataService.getRegierungsBezirke().toPromise().then((val: FeatureCollection) => {
      this.overlays.push(new Overlay('Regierunsbezirke', val));
    });

    this.dataService.getLandkreise().toPromise().then((val: FeatureCollection) => {
      this.overlays.push(new LandkreisLayer('Landkreise', val));
    });

    this.dataService.getBardichte().toPromise().then((val: FeatureCollection) => {
      this.overlays.push(new BardichteLayer('Bar Density', val));
    });

    this.dataService.getAverageBardichte().toPromise().then((val: FeatureCollection) => {
      this.overlays.push(new AverageBardichteLayer('Average Bar Density', val));
    });
  }
}
