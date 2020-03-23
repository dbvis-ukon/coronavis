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
  constructor(name: string, hospitals: FeatureCollection, private type: String, private dataDuration: String, private isRelative: boolean, private tooltipService: TooltipService, private colorsService: ColormapService) {
    super(name, hospitals);
  }

  private getCaseNumbers(d: GeoJsonProperties): number {
    const combined = d.combined;
    if (this.isRelative === false) {
      if (this.dataDuration === "latest") {
        const last = combined[0];
        // console.log(cases, last, last.cases);
        if (this.type === "cases") {
          return last.cases;
        }
        return last.deaths;
      }
      if (this.dataDuration === "24h") {
        const last = combined[0];
        const prev = combined[1];
        if (this.type === "cases") {
          return last.cases - prev.cases;
        }
        return last.deaths - prev.deaths;
      }
      if (this.dataDuration === "72h") {
        const last = combined[0];
        const prev = combined[2];
        if (this.type === "cases") {
          return last.cases - prev.cases;
        }
        return last.deaths - prev.deaths;
      }
    } else {
      if (this.dataDuration === "latest") {
        throw "Unsupported configuration -- cannot show percentage change for single value";
      }
      if (this.dataDuration === "24h") {
        const last = combined[0];
        const prev = combined[1];
        if (this.type === "cases") {
          console.log(last.cases, prev.cases, ((last.cases - prev.cases) / prev.cases) * 100 || 0);
          return ((last.cases - prev.cases) / prev.cases) * 100 || 0;
        }
        return ((last.deaths - prev.deaths) / prev.deaths) * 100 || 0;
      }
      if (this.dataDuration === "72h") {
        const last = combined[0];
        const prev = combined[2];
        if (this.type === "cases") {
          console.log(last.cases, prev.cases, ((last.cases - prev.cases) / prev.cases) * 100 || 0);
          return ((last.cases - prev.cases) / prev.cases) * 100 || 0;
        }
        return ((last.deaths - prev.deaths) / prev.deaths) * 100 || 0;
      }
    }
  }

  createOverlay() {
    const cases = this.featureCollection.features.map(d => this.getCaseNumbers(d.properties));

    let normalizeValues;
    if (this.isRelative === false) {
      normalizeValues = d3.scaleLinear()
        .domain([0, d3.max(cases)])
        .range([0, 1]);
    } else {
      const [minChange, maxChange] = d3.extent(cases.filter(d => d < Infinity));
      const max = Math.max(Math.abs(minChange), Math.abs(maxChange));
      console.log(minChange, maxChange, max);
      normalizeValues = d3.scaleLinear()
        .domain([-max, max])
        .range([1, 0])
        .clamp(true);
    }


    // create geojson layer (looks more complex than it is)
    const aggregationLayer = L.geoJSON(this.featureCollection, {
      style: (feature) => {
        let color;
        if (this.isRelative === false) {
          color = this.type === "cases" ?
            this.colorsService.getCaseColor(normalizeValues(this.getCaseNumbers(feature.properties))) :
            this.colorsService.getDeathsColor(normalizeValues(this.getCaseNumbers(feature.properties)));
        } else {
          color = this.colorsService.getDiff(normalizeValues(this.getCaseNumbers(feature.properties)))
        }
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

            tooltipComponent.name = feature.properties.name;
            tooltipComponent.combined = feature.properties.combined;
            tooltipComponent.datum = feature.properties.until;

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
