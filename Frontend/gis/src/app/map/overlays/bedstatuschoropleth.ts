import * as L from 'leaflet';
import { Overlay } from './overlay';
import {ColormapService} from "../../services/colormap.service";
import {AggregatedHospitals, AggregatedHospitalsProperties} from "../../services/divi-hospitals.service";
import { BedType } from '../options/bed-type.enum';
import { AggregationLevel } from '../options/aggregation-level.enum';

export class BedStatusChoropleth extends Overlay<AggregatedHospitals> {

  constructor(name: string, hospitals: AggregatedHospitals, private aggregationLevel: AggregationLevel, private type: BedType,
              private colorsService: ColormapService) {
    super(name, hospitals);
  }

  private propertyAccessor(d: AggregatedHospitalsProperties, type: BedType) {
    switch (type) {
      case BedType.ecmo:
        return d.ecmo_state;
      case BedType.icuHigh:
        return d.icu_high_state;
      case BedType.icuLow:
        return d.icu_low_state;
    }
  }

  getAggregationLevel(): AggregationLevel {
    return this.aggregationLevel;
  }

  getGlyphState(): BedType {
    return this.type;
  }

  createOverlay() {
    // create geojson layer (looks more complex than it is)
    const aggregationLayer = L.geoJSON(this.featureCollection, {
      style: (feature) => {
        return {
          fillColor: this.colorsService.getBedStatusColor(this.propertyAccessor(feature.properties, this.type)),
          weight: 0.5,
          opacity: 1,
          color: 'gray',
          // dashArray: '3',
          fillOpacity: 1,
          pointerEvents: 'none'
        };
      },
    });

    return aggregationLayer;
  }
}
