import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import { AggregatedHospitalsState } from './divi-hospitals.service';
import { ScaleLinear } from 'd3';

@Injectable({
  providedIn: 'root'
})
export class ColormapService {
  constructor() {}

   private colors = ['rgb(113,167,133)', 'rgb(230,181,72)', 'rgb(198,106,75)'];

  getSingleHospitalColormap(): d3.ScaleOrdinal<string, string> {
      return d3.scaleOrdinal<string, string>().domain(['Verfügbar', 'Begrenzt', 'Ausgelastet', 'Nicht verfügbar'])
      .range(this.colors.concat(['#bbbbbb']));
  }

  getContinousColorMap(): ScaleLinear<string, string> {
    return d3.scaleLinear<string, string>()
      .domain([0, 1, 2])
      .range(this.colors)
      .interpolate(d3.interpolateRgb.gamma(2.2))
  }

  getMaxColor(state: AggregatedHospitalsState): string {
    let maxNumber = 0;
    let maxFeature = 'Nicht verfügbar';

    for (const key in state) {
        if (state.hasOwnProperty(key)) {
            const element = state[key];
            if (element > maxNumber) {
              maxNumber = element;
              maxFeature = key;
            }
        }
    }
    const c = this.getSingleHospitalColormap();
    return c(maxFeature);
  }


}
