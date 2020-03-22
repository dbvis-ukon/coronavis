import { Component, OnInit } from '@angular/core';
import { DataService } from './services/data.service';
import { FeatureCollection } from 'geojson';
import { Overlay } from './map/overlays/overlay';
import { TooltipService } from './services/tooltip.service';
import { HelipadLayer } from './map/overlays/helipads';
import { HospitalLayer } from './map/overlays/hospital';



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
    this.dataService.getOSMHospitals().toPromise().then((val: FeatureCollection) => {
      this.overlays.push(new HospitalLayer('Hospitals', val, this.tooltipService));
    });

    this.dataService.getOSHelipads().toPromise().then((val: FeatureCollection) => {
      this.overlays.push(new HelipadLayer('Helipads', val, this.tooltipService));
    });
  }
}
