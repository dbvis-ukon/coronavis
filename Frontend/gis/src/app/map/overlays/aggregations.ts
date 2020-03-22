import { FeatureCollection } from 'geojson';

import * as L from 'leaflet';
import { Overlay } from './overlay';
import { TooltipService } from 'src/app/services/tooltip.service';
import * as d3 from "d3";
import {TooltipDemoComponent} from "../../tooltip-demo/tooltip-demo.component";

export class AggregationLayer extends Overlay {
  private type: String;
  constructor(name: string, featureCollection: FeatureCollection, type: String) {
    super(name, featureCollection);
  }

  createOverlay() {
    const minMaxArea = d3.extent(this.featureCollection.features.map(d => d.properties.area));
    const colorScale = d3.scaleSequential(d3.interpolateReds).domain(minMaxArea);

    // create geojson layer (looks more complex than it is)
    const aggregationLayer = L.geoJSON(this.featureCollection, {
      style: (feature) => {
        return {
          fillColor: colorScale(feature.properties.area),
          weight: 2,
          opacity: 1,
          color: 'white',
          dashArray: '3',
          fillOpacity: 0.7
        };
      },
    });

    return aggregationLayer;
  }
}
