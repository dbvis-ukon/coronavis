import { MatDialog } from '@angular/material/dialog';
import { Feature, FeatureCollection, Geometry } from 'geojson';
import * as L from 'leaflet';
import { CaseDialogComponent } from 'src/app/case-dialog/case-dialog.component';
import { CaseChoroplethColormapService } from 'src/app/services/case-choropleth-colormap.service';
import { QuantitativeAggregatedRkiCasesOverTimeProperties } from 'src/app/services/types/quantitative-aggregated-rki-cases-over-time';
import { CaseTooltipComponent } from "../../case-tooltip/case-tooltip.component";
import { TooltipService } from "../../services/tooltip.service";
import { CovidNumberCaseOptions } from '../options/covid-number-case-options';
import { Overlay } from './overlay';

export class CaseChoropleth extends Overlay<QuantitativeAggregatedRkiCasesOverTimeProperties> {
  

  constructor(
    name: string,
    hospitals: FeatureCollection<Geometry, QuantitativeAggregatedRkiCasesOverTimeProperties>,
    private options: CovidNumberCaseOptions,
    private tooltipService: TooltipService,
    private colorsService: CaseChoroplethColormapService,
    private matDialog: MatDialog
  ) {
    super(name, hospitals);
  }

  createOverlay() {
    const onAction = (e: L.LeafletMouseEvent, feature: any, aggregationLayer: any) => {
      const onCloseAction: () => void = () => {
        aggregationLayer.resetStyle(e.target);
      };

      const tooltipComponent = this.tooltipService
        .openAtElementRef(CaseTooltipComponent, {
          x: e.originalEvent.clientX,
          y: e.originalEvent.clientY
        }, onCloseAction);

      tooltipComponent.data = feature.properties;

      // set highlight style
      const l = e.target;
      l.setStyle({
        weight: 3,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
      });

      // l.bringToFront();
    };

    const scaleFn = this.colorsService.getScale(this.featureCollection, this.options);

    // create geojson layer (looks more complex than it is)
    const aggregationLayer = L.geoJSON(this.featureCollection, {
      style: (feature: Feature<Geometry, QuantitativeAggregatedRkiCasesOverTimeProperties>) => {

        const numbers = this.colorsService.getCaseNumbers(feature.properties, this.options);

        return {
          fillColor: this.colorsService.getChoroplethCaseColor(scaleFn(numbers)),
          weight: 0.5,
          opacity: 1,
          color: 'gray',
          // dashArray: '3',
          fillOpacity: 1
        };
      },
      onEachFeature: (feature, layer) => {
        layer.on({
          // on mouseover update tooltip and highlight county
          click: () => {
            this.tooltipService.close();
            this.matDialog.open(CaseDialogComponent, {
              data: feature.properties
            })
          },
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
