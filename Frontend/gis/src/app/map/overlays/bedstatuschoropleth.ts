import * as L from 'leaflet';
import { Overlay } from './overlay';
import * as d3 from "d3";
import {ColormapService} from "../../services/colormap.service";
import {AggregatedHospitals, AggregatedHospitalsProperties} from "../../services/divi-hospitals.service";
import { BedType } from '../options/bed-type.enum';
import { AggregationLevel } from '../options/aggregation-level.enum';

export class BedStatusChoropleth extends Overlay<AggregatedHospitals> {

  constructor(name: string, hospitals: AggregatedHospitals, private aggregationLevel: AggregationLevel, private type: BedType,
              private colorsService: ColormapService) {
    super(name, hospitals);
  }

  public get MinMax(): [number, number] {
    return this.minMaxValues;
  }

  public get NormMinMax(): number[] {
    return this.minMaxNormValues;
  }

  public get NormValuesFunc() {
    return this.normalizeValues;
  }

  private minMaxValues: [number, number];
  private minMaxNormValues: number[];
  private normalizeValues;

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
    this.minMaxValues = [0, d3.max(scores)];
    this.minMaxNormValues = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
    this.normalizeValues = d3.scaleQuantize()
      .domain(this.minMaxValues)
      .range(this.minMaxNormValues);

    // create geojson layer (looks more complex than it is)
    const aggregationLayer = L.geoJSON(this.featureCollection, {
      style: (feature) => {
        return {
          fillColor: this.colorsService.getBedStatusColor(this.normalizeValues(this.getScore(feature.properties)), this.propertyAccessor(feature.properties, this.type)["Nicht verfügbar"] > 0),
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
