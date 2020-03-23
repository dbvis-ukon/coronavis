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
    const landkreiseHospitalsLayer = L.geoJSON(this.featureCollection);
    return landkreiseHospitalsLayer;
  }
}
