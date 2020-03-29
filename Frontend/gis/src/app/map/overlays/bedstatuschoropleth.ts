import * as L from 'leaflet';
import { Overlay } from './overlay';
import {ColormapService} from "../../services/colormap.service";
import {AggregatedHospitals, AggregatedHospitalsProperties} from "../../services/divi-hospitals.service";
import { BedType } from '../options/bed-type.enum';
import { AggregationLevel } from '../options/aggregation-level.enum';
import {CaseTooltipComponent} from "../../case-tooltip/case-tooltip.component";
import {TooltipService} from "../../services/tooltip.service";
import {AggregatedGlyphTooltipComponent} from "../../aggregated-glyph-tooltip/aggregated-glyph-tooltip.component";

export class BedStatusChoropleth extends Overlay<AggregatedHospitals> {

  constructor(name: string, hospitals: AggregatedHospitals, private aggregationLevel: AggregationLevel, private type: BedType,
              private colorsService: ColormapService, private tooltipService: TooltipService) {
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
    const onAction = (e: L.LeafletMouseEvent, feature: any, aggregationLayer: any) => {
      const onCloseAction: () => void = () => {
        aggregationLayer.resetStyle(e.target);
      };

      const tooltipComponent = this.tooltipService
        .openAtElementRef(AggregatedGlyphTooltipComponent, {
          x: e.originalEvent.clientX,
          y: e.originalEvent.clientY
        }, onCloseAction);

      tooltipComponent.name = feature.properties.name;
      tooltipComponent.combined = feature.properties.combined;
      tooltipComponent.datum = feature.properties.until;
      tooltipComponent.einwohner = +feature.properties.bevoelkerung;

      // set highlight style
      const l = e.target;
      l.setStyle({
        weight: 3,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
      });

      l.bringToFront();
    };

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
      onEachFeature: (feature, layer) => {
        layer.on({
          // on mouseover update tooltip and highlight county
          click: (e: L.LeafletMouseEvent) => onAction(e, feature, aggregationLayer),
          mouseover: (e: L.LeafletMouseEvent) => onAction(e, feature, aggregationLayer),
          // on mouseover hide tooltip and reset county to normal sytle
          mouseout: (e: L.LeafletMouseEvent) => {
            this.tooltipService.close();
          }
        });
      }
    });

    return aggregationLayer;
  }
}
