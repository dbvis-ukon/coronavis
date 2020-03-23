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

  /**
   * Retrieve data from server and add it to the overlays arrays
   */
  ngOnInit(): void {
    // this.dataService.getRegierungsBezirke().toPromise().then((val: FeatureCollection) => 

    this.dataService.getCaseData().subscribe(data => {
      this.overlays.push(new CaseChoropleth('Cases Lankreis latest', data, "cases", "latest", false, this.tooltipService, this.colormapService));
      this.overlays.push(new CaseChoropleth('Deaths Lankreis latest', data, "deaths", "latest", false, this.tooltipService, this.colormapService));

      this.overlays.push(new CaseChoropleth('Cases Lankreis 24h', data, "cases", "24h", false, this.tooltipService, this.colormapService));
      this.overlays.push(new CaseChoropleth('Deaths Lankreis 24h', data, "deaths", "24h", false, this.tooltipService, this.colormapService));

      this.overlays.push(new CaseChoropleth('Cases Lankreis 72h', data, "cases", "72h", false, this.tooltipService, this.colormapService));
      this.overlays.push(new CaseChoropleth('Deaths Lankreis 72h', data, "deaths", "72h", false, this.tooltipService, this.colormapService));

      this.overlays.push(new CaseChoropleth('Cases Lankreis 24h %', data, "cases", "24h", true, this.tooltipService, this.colormapService));
      this.overlays.push(new CaseChoropleth('Deaths Lankreis 24h %', data, "deaths", "24h", true, this.tooltipService, this.colormapService));

      this.overlays.push(new CaseChoropleth('Cases Lankreis 72h %', data, "cases", "72h", true, this.tooltipService, this.colormapService));
      this.overlays.push(new CaseChoropleth('Deaths Lankreis 72h %', data, "deaths", "72h", true, this.tooltipService, this.colormapService));
    })
  }
}
