import { FeatureCollection } from 'geojson';

import * as L from 'leaflet';
import { Overlay } from './overlay';
import { TooltipService } from 'src/app/services/tooltip.service';

// const helipadIcon = L.icon({
//   iconUrl: 'Helipad.png',

//   iconSize:     [16, 16], // size of the iconow
//   iconAnchor:   [8, 8], // point of the icon which will correspond to marker's location
// });

export class HelipadLayer extends Overlay<FeatureCollection> {
  constructor(
    name: string,
    featureCollection: FeatureCollection,
    private tooltipService: TooltipService
  ) {
    super(name, featureCollection);
  }

  createOverlay() {
    const geojsonMarkerOptions = {
      radius: 4,
      fillColor: '#8461c4',
      // icon: helipadIcon,
      color: '#8461c4',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    };

    // create geojson layer (looks more complex than it is)
    const helipadLayer = L.geoJSON(this.featureCollection, {
      pointToLayer: (feature, latlng) => {
        return L.circleMarker(latlng, geojsonMarkerOptions);
      }
    });

    return helipadLayer;
  }
}
