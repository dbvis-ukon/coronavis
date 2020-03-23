import {FeatureCollection, GeoJsonProperties} from 'geojson';

import * as L from 'leaflet';
import { Overlay } from './overlay';
import * as d3 from "d3";
import {ColormapService} from "../../services/colormap.service";
import {AggregatedHospitals, AggregatedHospitalsProperties} from "../../services/divi-hospitals.service";
import { ScaleLinear } from 'd3';
import {TooltipService} from "../../services/tooltip.service";
import {GlyphTooltipComponent} from "../../glyph-tooltip/glyph-tooltip.component";
import {CaseTooltipComponent} from "../../case-tooltip/case-tooltip.component";

export class CaseChoropleth extends Overlay<FeatureCollection> {
  constructor(name: string, hospitals: FeatureCollection, private type: String, private dataDuration: String, private tooltipService: TooltipService, private colorsService: ColormapService) {
    super(name, hospitals);
  }

  private getCaseNumbers(d: GeoJsonProperties, type: String, dataDuration: String): number {
    const cases = d.cases;
    if (dataDuration === "24h") {
      const last = cases[cases.length - 1];
      console.log(cases, last, last.cases);
      if (type === "cases") {
        return last.cases;
      }
      return last.deaths;
    }
  }

  createOverlay() {
    const cases = this.featureCollection.features.map(d => this.getCaseNumbers(d.properties, this.type, this.dataDuration));
    const normalizeValues = d3.scaleLinear()
      .domain(d3.extent(cases))
      .range([0, 1]);

    // create geojson layer (looks more complex than it is)
    const aggregationLayer = L.geoJSON(this.featureCollection, {
      style: (feature) => {
        let color = this.type === "cases" ?
          this.colorsService.getCaseColor(normalizeValues(this.getCaseNumbers(feature.properties, this.type, this.dataDuration))) :
          this.colorsService.getDeathsColor(normalizeValues(this.getCaseNumbers(feature.properties, this.type, this.dataDuration)));
        return {
          fillColor: color,
          weight: 2,
          opacity: 1,
          color: 'white',
          dashArray: '3',
          fillOpacity: 0.7
        };
      },
      onEachFeature: (feature, layer) => {
        layer.on({
          // on mouseover update tooltip and highlight county
          mouseover: (e: L.LeafletMouseEvent) => {

            const tooltipComponent = this.tooltipService
              .openAtElementRef(CaseTooltipComponent, {x: e.originalEvent.clientX, y: e.originalEvent.clientY});

            tooltipComponent.name = `County: ${feature.properties.name}`;

            // set highlight style
            const l = e.target;
            l.setStyle({
              weight: 5,
              color: '#666',
              dashArray: '',
              fillOpacity: 0.7
            });

            l.bringToFront();
          },
          // on mouseover hide tooltip and reset county to normal sytle
          mouseout: (e: L.LeafletMouseEvent) => {
            this.tooltipService.close();
            aggregationLayer.resetStyle(e.target);
          }
        });
      }
    });

    return aggregationLayer;
  }
}
