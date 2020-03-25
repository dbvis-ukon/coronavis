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
  public static bedStati = ['Verfügbar', 'Begrenzt', 'Ausgelastet', 'Nicht Verfügbar'];

  public static BedStatusColor = d3.scaleLinear<string, string>()
      .domain([0, 0.5, 1])
      .range(ColormapService.bedStatusColors)
      .interpolate(d3.interpolateRgb.gamma(2.2));

  private colors = ['rgb(113,167,133)', 'rgb(230,181,72)', 'rgb(198,106,75)'];

  private continousColorMap = d3.scaleLinear<string, string>()
    .domain([0, 0.5, 1])
    .range(this.colors)
    .interpolate(d3.interpolateRgb.gamma(2.2));

  private caseChoroplethColorMap = d3.scaleQuantize<string>()
    .domain([-1, 1])
    .range([...d3.schemeGreens[6].slice(0, 5).reverse(), '#fff', ...d3.schemeBlues[6].slice(0, 5)]);
    // .range([...d3.schemeRdBu[11]].reverse());

  getSingleHospitalColormap(): d3.ScaleOrdinal<string, string> {
      return d3.scaleOrdinal<string, string>().domain(ColormapService.bedStati)
      .range([...this.colors, '#bbbbbb']);
  }

  getChoroplethCaseColor(normalizedDiff: number): string {
    return this.caseChoroplethColorMap(normalizedDiff);
  }

  getBedStatusColor(normalizedScore: number): string {
    if (isNaN(normalizedScore)) {
      return '#bbb';
    }
    return this.continousColorMap(normalizedScore);
  }
}
