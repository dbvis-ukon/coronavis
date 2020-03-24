import * as L from 'leaflet';

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
    console.log(colorMap, colorMap(0.3));
    console.log(normalizeFunction);
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
      const grades = []; // [0, 10, 20, 50, 100, 200, 500, 1000];
      const labels = [];
      for (let i = 0; i <= this.steps; i++) {
        grades.push(this.minMaxValues[0] + ((this.minMaxValues[1] - this.minMaxValues[0]) / this.steps) * i);
      }

      // loop through our density intervals and generate a label with a colored square for each interval
      for (let i = 0; i < grades.length; i++) {
        div.innerHTML +=
          '<i style="background:' + this.colorMap(this.normalizeValues(grades[i] + 1)) + '"></i> ' +
          grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
      }

      return div;
    };

    return this.legend;
  }
}
