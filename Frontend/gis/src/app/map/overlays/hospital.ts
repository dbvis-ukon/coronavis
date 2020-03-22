import { FeatureCollection } from 'geojson';

import * as L from 'leaflet';
import { Overlay } from './overlay';
import { TooltipService } from 'src/app/services/tooltip.service';

export class HospitalLayer extends Overlay {
  constructor(
    name: string,
    featureCollection: FeatureCollection,
    private tooltipService: TooltipService
  ) {
    super(name, featureCollection);
  }

  createOverlay() {
    const geojsonMarkerOptions = {
      radius: 8,
      fillColor: '#d53210',
      color: '#000',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    };

    // create geojson layer (looks more complex than it is)
    const hospitalLayer = L.geoJSON(this.featureCollection, {
      pointToLayer: (feature, latlng) => {
        return L.circleMarker(latlng, geojsonMarkerOptions);
      }
    });
    return hospitalLayer;
  }
}
