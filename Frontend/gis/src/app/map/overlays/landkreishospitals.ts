import { FeatureCollection } from 'geojson';

import * as L from 'leaflet';
import { Overlay } from './overlay';
import { TooltipService } from 'src/app/services/tooltip.service';

export class LandkreiseHospitalsLayer extends Overlay<FeatureCollection> {
  constructor(
    name: string,
    featureCollection: FeatureCollection,
    private tooltipService: TooltipService
  ) {
    super(name, featureCollection);
  }

  createOverlay() {

    // create geojson layer (looks more complex than it is)
    const landkreiseHospitalsLayer = L.geoJSON(this.featureCollection, {
      style: () => {
          return {
              fillColor: 'transparent',
              weight: 0.5,
              opacity: 1,
              color: 'grey',
              // dashArray: '3',
              // fillOpacity: 0.7
          };
      }});

    return landkreiseHospitalsLayer;
  }
}
