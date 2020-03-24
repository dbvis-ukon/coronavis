import * as L from 'leaflet';
import { Overlay } from './overlay';
import * as d3 from "d3";
import {ColormapService} from "../../services/colormap.service";
import {AggregatedHospitals, AggregatedHospitalsProperties} from "../../services/divi-hospitals.service";
import { GlyphState } from '../options/glyph-state';
import { AggregationLevel } from '../options/aggregation-level';

export class BedStatusChoropleth extends Overlay<AggregatedHospitals> {
  constructor(name: string, hospitals: AggregatedHospitals, private aggregationLevel: AggregationLevel, private type: GlyphState, private colorsService: ColormapService) {
    super(name, hospitals);
  }

  private propertyAccessor(d: AggregatedHospitalsProperties, type: GlyphState) {
    switch (type) {
      case GlyphState.ecmo:
        return d.ecmo_state;
      case GlyphState.icuHigh:
        return d.icu_high_state;
      case GlyphState.icuLow:
        return d.icu_low_state;
    }
  }

  getAggregationLevel(): AggregationLevel {
    return this.aggregationLevel;
  }

  getGlyphState(): GlyphState {
    return this.type;
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

    const range = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
    const normalizeValues = d3.scaleQuantize()
      .domain([0, d3.max(scores)])
      .range(range);

    // create geojson layer (looks more complex than it is)
    const aggregationLayer = L.geoJSON(this.featureCollection, {
      style: (feature) => {
        return {
          fillColor: this.colorsService.getBedStatusColor(normalizeValues(this.getScore(feature.properties))),
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
