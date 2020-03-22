import { Component, OnInit } from '@angular/core';
import { DataService } from './services/data.service';
import { FeatureCollection } from 'geojson';
<<<<<<< HEAD
import { Overlay } from './map/overlays/overlay';
import { LandkreisLayer } from './map/overlays/landkreis';
import { TooltipService } from './services/tooltip.service';
import { HelipadLayer } from './map/overlays/helipads';
import { HospitalLayer } from './map/overlays/hospital';
=======
import { Overlay,  Hospitals  } from './types/map.types';
>>>>>>> adf1694bb525378c4cfa68fb3eeb657f477e4abf



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  overlays: Array<Overlay> = new Array<Overlay>();

  // constructor is here only used to inject services
  constructor(private dataService: DataService, private tooltipService: TooltipService) { }

  /**
   * Retrieve data from server and add it to the overlays arrays
   */
  ngOnInit(): void {
<<<<<<< HEAD
    this.dataService.getOSMHospitals().toPromise().then((val: FeatureCollection) => {
      this.overlays.push(new HospitalLayer('Hospitals', val, this.tooltipService));
    });

    this.dataService.getOSHelipads().toPromise().then((val: FeatureCollection) => {
      this.overlays.push(new HelipadLayer('Helipads', val, this.tooltipService));
    });
=======
    this.dataService.getHospitals().toPromise().then((val: FeatureCollection) => {
      this.overlays.push(new Hospitals('Hospitals', val));
    });

>>>>>>> adf1694bb525378c4cfa68fb3eeb657f477e4abf
  }
}
