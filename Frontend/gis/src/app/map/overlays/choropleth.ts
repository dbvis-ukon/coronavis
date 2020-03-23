import { FeatureCollection } from 'geojson';

import * as L from 'leaflet';
import { Overlay } from './overlay';
import * as d3 from "d3";
import {ColormapService} from "../../services/colormap.service";
import {AggregatedHospitals, AggregatedHospitalsProperties} from "../../services/divi-hospitals.service";
import { ScaleLinear } from 'd3';

export class ChoroplethLayer extends Overlay<AggregatedHospitals> {
  constructor(name: string, hospitals: AggregatedHospitals, private type: String, private colorsService: ColormapService) {
    super(name, hospitals);
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
          fillColor: this.colorsService.getBedStatusColor(normalizeValues(this.getScore(feature.properties))),
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
