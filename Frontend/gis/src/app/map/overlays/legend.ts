import * as L from 'leaflet';
import {ColormapService} from '../../services/colormap.service';
import {CovidNumberCaseNormalization, CovidNumberCaseOptions} from '../options/covid-number-case-options';

export class Legend {
  constructor(
    minMax: [number, number], minMaxNorm: [number, number],
    normalizeFunction, colorMap, steps: number, options?: CovidNumberCaseOptions
  ) {
    this.minMaxValues = minMax;
    this.minMaxNormValues = minMaxNorm;
    this.normalizeValues = normalizeFunction;
    this.colorMap = colorMap;
    this.steps = steps;
    this.covidNumberCaseOptions = options;
  }
  private minMaxValues: [number, number];
  private minMaxNormValues: [number, number];
  private normalizeValues;
  private colorMap;
  private steps: number;
  private covidNumberCaseOptions: CovidNumberCaseOptions;

  private legend;
  createLegend() {
    this.legend = new L.Control({position: 'bottomright'});

    this.legend.onAdd = (map) => {

      const div = L.DomUtil.create('div', 'info legend color-map-legend');
      const grades = [];
      for (let i = 0; i <= this.steps; i++) {
        grades.push(this.minMaxValues[0] + ((this.minMaxValues[1] - this.minMaxValues[0]) / this.steps) * i);
      }

      let normVal = 1;

      if ((this.covidNumberCaseOptions && this.covidNumberCaseOptions.normalization === CovidNumberCaseNormalization.per100k)) {
        normVal = 100000;
      }

      // loop through our density intervals and generate a label with a colored square for each interval
      let prevColor;
      let prevD;
      let lastColor = true;
      ColormapService.CChoroplethColorMap.range().map((color, i) => {
        const d = ColormapService.CChoroplethColorMap.invertExtent(color);
        d[0] = this.normalizeValues.invert(d[0]);
        d[1] = this.normalizeValues.invert(d[1]);
        const d0Fixed = (d[0] * normVal).toFixed(0);
        const d1Fixed = (d[1] * normVal).toFixed(0);
        if (this.minMaxValues[0] < d[0] && this.minMaxValues[1] > d[1] ) {
          div.innerHTML +=
            '<i style="background:' + color + '"></i> ' + d0Fixed + ((d[1]) ? ' &ndash; ' + d1Fixed + '<br>' : '+');
        }
        if (this.minMaxValues[1] <= d[1] && lastColor) {
          lastColor = false;
          div.innerHTML +=
            '<i style="background:' + color + '"></i> ' + d0Fixed + ((d[1]) ? ' &ndash; ' + d1Fixed + '<br>' : '+');
        }
        prevColor = color;
        prevD = d;
      });

      for (let i = 0; i < grades.length - 1; i++) {
      }

      return div;
    };

    return this.legend;
  }
}
