import * as L from 'leaflet';
import {ColormapService} from '../../services/colormap.service';

export class Legend {
  constructor(
    minMax: [number, number], minMaxNorm: [number, number],
    normalizeFunction, colorMap, steps: number
  ) {
    this.minMaxValues = minMax;
    this.minMaxNormValues = minMaxNorm;
    this.normalizeValues = normalizeFunction;
    this.colorMap = colorMap;
    this.steps = steps;
  }
  private minMaxValues: [number, number];
  private minMaxNormValues: [number, number];
  private normalizeValues;
  private colorMap;
  private steps: number;

  private legend;
  createLegend() {
    this.legend = new L.Control({position: 'bottomright'});

    this.legend.onAdd = (map) => {

      const div = L.DomUtil.create('div', 'info legend color-map-legend');
      const grades = [];
      for (let i = 0; i <= this.steps; i++) {
        grades.push(this.minMaxValues[0] + ((this.minMaxValues[1] - this.minMaxValues[0]) / this.steps) * i);
      }

      console.log(grades, this.minMaxNormValues, this.minMaxValues);

      // loop through our density intervals and generate a label with a colored square for each interval
      let prevColor;
      let prevD;
      let lastColor = true;
      ColormapService.CChoroplethColorMap.range().map((color, i) => {
        const d = ColormapService.CChoroplethColorMap.invertExtent(color);
        d[0] = this.normalizeValues.invert(d[0]);
        d[1] = this.normalizeValues.invert(d[1]);
        if (this.minMaxValues[0] < d[0] && this.minMaxValues[1] > d[1] ) {
          div.innerHTML +=
            '<i style="background:' + color + '"></i> ' +
            d[0].toFixed(0) + (d[1] ? ' &ndash; ' + d[1].toFixed(0) + '<br>' : '+');
        }
        if (this.minMaxValues[1] <= d[1] && lastColor) {
          lastColor = false;
          div.innerHTML +=
            '<i style="background:' + color + '"></i> ' +
            d[0].toFixed(0) + (d[1] ? ' &ndash; ' + d[1].toFixed(0) + '<br>' : '+');
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
