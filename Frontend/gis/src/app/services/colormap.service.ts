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

  private colors = ['rgb(113,167,133)', 'rgb(230,181,72)', 'rgb(198,106,75)'];

  private continousColorMap = d3.scaleLinear<string, string>()
    .domain([0, 1, 2])
    .range(this.colors)
    .interpolate(d3.interpolateRgb.gamma(2.2))

  getSingleHospitalColormap(): d3.ScaleOrdinal<string, string> {
      return d3.scaleOrdinal<string, string>().domain(['Verfügbar', 'Begrenzt', 'Ausgelastet', 'Nicht verfügbar'])
      .range([...this.colors, '#bbbbbb']);
  }

  getContinousColorMap(): ScaleLinear<string, string> {
    return d3.scaleLinear<string, string>()
      .domain([0, 0.5, 1])
      .range(this.colors)
      .interpolate(d3.interpolateRgb.gamma(2.2))
  }

  getCaseColor(normalizedCount: number): string {
    return d3.interpolateBlues(normalizedCount)
  }

  getDeathsColor(normalizedCount: number): string {
    return d3.interpolateReds(normalizedCount);
  }

  getDiff(normalizedDiff: number): string {
    return d3.interpolateRdBu(normalizedDiff);
  }

  getBedStatusColor(normalizedScore: number): string {
    if (isNaN(normalizedScore)) {
      return "#bbb";
    }
    // console.log(normalizedScore, this.continousColorMap(normalizedScore));
    return this.continousColorMap(normalizedScore);
  }
}
