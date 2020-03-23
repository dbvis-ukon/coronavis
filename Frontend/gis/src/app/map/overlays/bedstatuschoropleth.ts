import { FeatureCollection } from 'geojson';

import * as L from 'leaflet';
import { Overlay } from './overlay';
import * as d3 from "d3";
import {ColormapService} from "../../services/colormap.service";
import {AggregatedHospitals, AggregatedHospitalsProperties} from "../../services/divi-hospitals.service";
import { ScaleLinear } from 'd3';

export class BedStatusChoropleth extends Overlay<AggregatedHospitals> {
  private colorMap: ScaleLinear<string, string>;
  constructor(name: string, hospitals: AggregatedHospitals, private type: String, colorsService: ColormapService) {
    super(name, hospitals);
    this.colorMap = colorsService.getContinousColorMap();
  }

  private propertyAccessor(d: AggregatedHospitalsProperties, type: String) {
    switch (type) {
      case "ecmo_state":
        return d.ecmo_state;
      case "icu_high_state":
        return d.icu_high_state;
      case "icu_low_state":
        return d.icu_low_state;
    }
  }

  private getScore(d: AggregatedHospitalsProperties) {
    const v = this.propertyAccessor(d, this.type).Verfügbar || 0;
    const b = this.propertyAccessor(d, this.type).Begrenzt || 0;
    const a = this.propertyAccessor(d, this.type).Ausgelastet || 0;

    return (b * 2 + a * 3) / (v + b + a);
  }

  createOverlay() {
    const scores = this.featureCollection.features.map(d => {
      return this.getScore(d.properties);
    });
    const scoreExtent = d3.extent(scores);
    const normalizeValues = d3.scaleLinear()
      .domain(scoreExtent)
      .range([0, 1]);

    // create geojson layer (looks more complex than it is)
    const aggregationLayer = L.geoJSON(this.featureCollection, {
      style: (feature) => {
        return {
          fillColor: this.colorMap(normalizeValues(this.getScore(feature.properties))),
          weight: 0.5,
          opacity: 1,
          color: 'gray',
          // dashArray: '3',
          fillOpacity: 1,
          pointerEvents: "none"
        };
      },
    });

    return aggregationLayer;
  }
}
