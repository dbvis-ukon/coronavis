import * as L from 'leaflet';
import { Overlay } from './overlay';
import { BedType } from '../options/bed-type.enum';
import { AggregationLevel } from '../options/aggregation-level.enum';
import {TooltipService} from "../../services/tooltip.service";
import { TooltipComponent } from '@angular/material/tooltip';
import { AbstractTimedStatus } from 'src/app/repositories/types/in/qualitative-hospitals-development';
import { FeatureCollection, MultiPolygon, Feature } from 'geojson';
import { AggregatedHospitalOut } from 'src/app/repositories/types/out/aggregated-hospital-out';
import { QualitativeColormapService } from 'src/app/services/qualitative-colormap.service';
import { QuantitativeColormapService } from 'src/app/services/quantitative-colormap.service';

export class BedStatusChoropleth<T extends AbstractTimedStatus>extends Overlay<FeatureCollection<MultiPolygon, AggregatedHospitalOut<T>>> {

  constructor(
    name: string, 
    hospitals: FeatureCollection<MultiPolygon, AggregatedHospitalOut<T>>, 
    private aggregationLevel: AggregationLevel, 
    private type: BedType,
    private colorsService: QuantitativeColormapService | QualitativeColormapService, 
    private tooltipService: TooltipService,
    ) {
      super(name, hospitals);
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
        .openAtElementRef(TooltipComponent, {
          x: e.originalEvent.clientX,
          y: e.originalEvent.clientY
        }, onCloseAction);

      // tooltipComponent.name = feature.properties.name;
      // tooltipComponent.combined = feature.properties.combined;
      // tooltipComponent.datum = feature.properties.until;
      // tooltipComponent.einwohner = +feature.properties.bevoelkerung;

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
      style: (feature: Feature<MultiPolygon, AggregatedHospitalOut<T>>) => {
        return {
          fillColor: this.colorsService.getLatestBedStatusColor(feature.properties.development as any, this.type),
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
