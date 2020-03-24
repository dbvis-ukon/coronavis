import * as L from 'leaflet';
import {ColormapService} from '../../services/colormap.service';
import {CovidNumberCaseNormalization, CovidNumberCaseOptions} from '../options/covid-number-case-options';

export class Legend {
  constructor(
    minMax: [number, number], minMaxNorm: number[],
    normalizeFunction, colorMap, type?: string, options?: CovidNumberCaseOptions
  ) {
    this.minMaxValues = minMax;
    this.minMaxNormValues = minMaxNorm;
    this.normalizeValues = normalizeFunction;
    if (type === 'bed') {
      this.colorMap = ColormapService.BedStatusColor;
    } else {
      this.colorMap = ColormapService.CChoroplethColorMap;
    }
    this.covidNumberCaseOptions = options;
    this.type = type;
  }
  private minMaxValues: [number, number];
  private minMaxNormValues: number[];
  private normalizeValues;
  private colorMap;
  private type: string;
  private covidNumberCaseOptions: CovidNumberCaseOptions;

  private legend;
  createLegend() {
    this.legend = new L.Control({position: 'bottomright'});

    this.legend.onAdd = (map) => {
      const div = L.DomUtil.create('div', 'info legend color-map-legend');

      let normVal = 1;

      if (this.type === 'case') {
        if ((this.covidNumberCaseOptions && this.covidNumberCaseOptions.normalization === CovidNumberCaseNormalization.per100k)) {
          normVal = 100000;
        }

        // loop through our density intervals and generate a label with a colored square for each interval
        let prevColor;
        let prevD;
        let lastColor = true;
        this.colorMap.range().map((color, i) => {
          const d = this.colorMap.invertExtent(color);

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
      } else {
        ColormapService.bedStatusColors.forEach((d, i) => {
          div.innerHTML += '<i style="background:' + d + '"></i> ' + ColormapService.bedStati[i] + '<br>';
        });
      }
      return div;
    };
    return this.legend;
  }
}
