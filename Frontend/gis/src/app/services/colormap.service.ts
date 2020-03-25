import {Injectable} from '@angular/core';
import * as d3 from 'd3';
import {AggregatedHospitalsState} from './divi-hospitals.service';
import {ScaleLinear} from 'd3';

@Injectable({
  providedIn: 'root'
})
export class ColormapService {
  constructor() {
  }

  public static CChoroplethColorMap = d3.scaleQuantize<string>()
    .domain([-1, 1])
    .range([...d3.schemeGreens[6].slice(0, 5).reverse(), '#fff', ...d3.schemeBlues[6].slice(0, 5)]);

  public static bedStatusColors = ['rgb(113,167,133)', 'rgb(230,181,72)', 'rgb(198,106,75)'];
  public static bedStati = ['Verfügbar', 'Begrenzt', 'Ausgelastet', 'Nicht verfügbar', "Keine Information"];

  public static BedStatusColor = d3.scaleLinear<string, string>()
      .domain([0, 0.5, 1])
      .range(ColormapService.bedStatusColors)
      .interpolate(d3.interpolateRgb.gamma(2.2));


  private singleHospitalCM = d3.scaleOrdinal<string, string>()
    .domain(ColormapService.bedStati)
    .range([...ColormapService.bedStatusColors, "#c2cbd4", "#bbb"]);
  getSingleHospitalColormap(): d3.ScaleOrdinal<string, string> {
    return this.singleHospitalCM;
  }

  private caseChoroplethColorMap = d3.scaleQuantize<string>()
    .domain([-1, 1])
    .range([...d3.schemeGreens[6].slice(0, 5).reverse(), '#fff', ...d3.schemeBlues[6].slice(0, 5)]);
  getChoroplethCaseColor(normalizedDiff: number): string {
    return this.caseChoroplethColorMap(normalizedDiff);
  }

  private continousColorMap = d3.scaleLinear<string, string>()
    .domain([0, 0.5, 1])
    .range(ColormapService.bedStatusColors)
    .interpolate(d3.interpolateRgb.gamma(2.2));
  getBedStatusColor(normalizedScore: number, notAvailableCountGreater0: boolean = true): string {
    if (isNaN(normalizedScore)) {
      if (notAvailableCountGreater0 === true) {
        return this.singleHospitalCM("Nicht verfügbar");
      }
      return this.singleHospitalCM("Keine Information");
    }
    return this.continousColorMap(normalizedScore);
  }
}
