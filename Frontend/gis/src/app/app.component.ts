import { Component, OnInit } from '@angular/core';
import { DataService } from './services/data.service';
import { FeatureCollection } from 'geojson';
import { Overlay } from './map/overlays/overlay';
import { TooltipService } from './services/tooltip.service';
import { TopoJsonService } from './services/topojson.service';
import { feature } from 'topojson';
import { map } from 'rxjs/operators';
import { StatesLayer } from './map/overlays/states.layer';
import { HelipadLayer } from './map/overlays/helipads';
import { HospitalLayer } from './map/overlays/hospital';
import { LandkreiseHospitalsLayer } from './map/overlays/landkreishospitals';
import {CaseChoropleth} from "./map/overlays/casechoropleth";
import {ColormapService} from "./services/colormap.service";



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  overlays: Array<Overlay<FeatureCollection>> = new Array<Overlay<FeatureCollection>>();

  // constructor is here only used to inject services
  constructor(private dataService: DataService, private tooltipService: TooltipService, private topoJsonService: TopoJsonService, private colormapService: ColormapService) { }

  /**
   * Retrieve data from server and add it to the overlays arrays
   */
  ngOnInit(): void {
    // this.dataService.getRegierungsBezirke().toPromise().then((val: FeatureCollection) => {
    //   this.overlays.push(new Overlay('Regierunsbezirke', val));
    // });

    // this.dataService.getLandkreise().toPromise().then((val: FeatureCollection) => {
    //   this.overlays.push(new LandkreisLayer('Landkreise', val, this.tooltipService));
    // });


    // this.topoJsonService.getTopoJsonGermany()
    // .pipe(
    //   map((j: any) => feature(j, j.objects.states))
    // )
    // .subscribe((json: any) => {
    //   this.overlays.push(new StatesLayer('Bundesländer', json));
    //
    // });



    // this.dataService.getOSMHospitals().toPromise().then((val: FeatureCollection) => {
    //   this.overlays.push(new HospitalLayer('Hospitals', val, this.tooltipService));
    // });
    //
    // this.dataService.getOSHelipads().toPromise().then((val: FeatureCollection) => {
    //   this.overlays.push(new HelipadLayer('Helipads', val, this.tooltipService));
    // });
    //
    // this.dataService.getHospitalsLandkreise().toPromise().then((val: FeatureCollection) => {
    //   this.overlays.push(new LandkreiseHospitalsLayer('Hospitals Landkreise', val, this.tooltipService));
    //
    // });
    //
    // this.dataService.getHospitalsRegierungsbezirke().toPromise().then((val: FeatureCollection) => {
    //   this.overlays.push(new LandkreiseHospitalsLayer('Hospitals Regierungsbezirke', val, this.tooltipService));
    // });
    //
    // this.dataService.getHospitalsBundeslaender().toPromise().then((val: FeatureCollection) => {
    //   this.overlays.push(new LandkreiseHospitalsLayer('Hospitals Bundesländer', val, this.tooltipService));
    // });

    this.dataService.getCasesLandkreise().subscribe(data => {
      this.overlays.push(new CaseChoropleth('Cases Lankreis 24h', data, "cases", "24h", this.tooltipService, this.colormapService));
      this.overlays.push(new CaseChoropleth('Deaths Lankreis 24h', data, "deaths", "24h", this.tooltipService, this.colormapService));
    });
  }
}
