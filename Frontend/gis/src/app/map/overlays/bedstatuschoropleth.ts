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
        return {free: d.icu_ecmo_care_frei, full: d.icu_ecmo_care_belegt, prognosis: d.icu_ecmo_care_einschaetzung, in24h: d.icu_ecmo_care_in_24h};
      case BedType.icuHigh:
        return {free: d.icu_high_care_frei, full: d.icu_high_care_belegt, prognosis: d.icu_high_care_einschaetzung, in24h: d.icu_high_care_in_24h};
      case BedType.icuLow:
        return {free: d.icu_low_care_frei, full: d.icu_low_care_belegt, prognosis: d.icu_low_care_einschaetzung, in24h: d.icu_low_care_in_24h };
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
