import { FeatureCollection } from 'geojson';

import * as L from 'leaflet';
import { Overlay } from './overlay';
import { TooltipService } from 'src/app/services/tooltip.service';

// const helipadIcon = L.icon({
//   iconUrl: 'Helipad.png',

//   iconSize:     [16, 16], // size of the iconow
//   iconAnchor:   [8, 8], // point of the icon which will correspond to marker's location
// });

export class Legends {
  constructor(
    name: string,
    private tooltipService: TooltipService
  ) {

  }

  createLegend() {

    function getColor(d) {
      return d > 1000 ? '#800026' :
        d > 500  ? '#BD0026' :
          d > 200  ? '#E31A1C' :
            d > 100  ? '#FC4E2A' :
              d > 50   ? '#FD8D3C' :
                d > 20   ? '#FEB24C' :
                  d > 10   ? '#FED976' :
                    '#FFEDA0';
    }

    const legend = new L.Control({position: 'bottomright'});

    legend.onAdd = (map) => {

      const div = L.DomUtil.create('div', 'info legend color-map-legend');
      const grades = [0, 10, 20, 50, 100, 200, 500, 1000];
      const labels = [];

      // loop through our density intervals and generate a label with a colored square for each interval
      for (let i = 0; i < grades.length; i++) {
        div.innerHTML +=
          '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
          grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
      }

      return div;
    };

    return legend;
  }

  activate()
}
