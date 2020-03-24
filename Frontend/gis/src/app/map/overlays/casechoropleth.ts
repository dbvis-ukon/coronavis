import {FeatureCollection, GeoJsonProperties} from 'geojson';

import * as L from 'leaflet';
import {Overlay} from './overlay';
import * as d3 from "d3";
import {ColormapService} from "../../services/colormap.service";
import {TooltipService} from "../../services/tooltip.service";
import {CaseTooltipComponent} from "../../case-tooltip/case-tooltip.component";
import {
  CovidNumberCaseChange,
  CovidNumberCaseNormalization,
  CovidNumberCaseOptions,
  CovidNumberCaseTimeWindow,
  CovidNumberCaseType
} from '../options/covid-number-case-options';

export class CaseChoropleth extends Overlay<FeatureCollection> {
  constructor(
    name: string,
    hospitals: FeatureCollection,
    private options: CovidNumberCaseOptions,
    private tooltipService: TooltipService,
    private colorsService: ColormapService
  ) {
    super(name, hospitals);
  }

  private getCaseNumbers(d: GeoJsonProperties): number {
    const combined = d.combined;
    if (this.options.change === CovidNumberCaseChange.absolute) {
      if (this.options.timeWindow === CovidNumberCaseTimeWindow.all) {
        const last = combined[0];
        if (this.options.type === CovidNumberCaseType.cases) {
          if (this.options.normalization === CovidNumberCaseNormalization.absolut) {
            return last.cases;
          } else {
            return last.cases / last.bevoelkerung;
          }
        }
        if (this.options.normalization === CovidNumberCaseNormalization.absolut) {
          return last.deaths;
        } else {
          return last.deaths / last.bevoelkerung;
        }
      }
      if (this.options.timeWindow === CovidNumberCaseTimeWindow.twentyFourhours) {
        const last = combined[0];
        const prev = combined[1];
        if (this.options.type === CovidNumberCaseType.cases) {
          if (this.options.normalization === CovidNumberCaseNormalization.absolut) {
            return last.cases - prev.cases;
          } else {
            return (last.cases - prev.cases) / last.bevoelkerung;
          }
        }
        if (this.options.normalization === CovidNumberCaseNormalization.absolut) {
          return last.deaths - prev.deaths;
        } else {
          return (last.deaths - prev.deaths) / last.bevoelkerung;
        }
      }
      if (this.options.timeWindow === CovidNumberCaseTimeWindow.seventyTwoHours) {
        const last = combined[0];
        const prev = combined[2];
        if (this.options.type === CovidNumberCaseType.cases) {
          if (this.options.normalization === CovidNumberCaseNormalization.absolut) {
            return last.cases - prev.cases;
          } else {
            return (last.cases - prev.cases) / last.bevoelkerung;
          }
        }
        if (this.options.normalization === CovidNumberCaseNormalization.absolut) {
          return last.deaths - prev.deaths;
        } else {
          return (last.deaths - prev.deaths) / last.bevoelkerung;
        }
      }
    } else {
      if (this.options.timeWindow === CovidNumberCaseTimeWindow.all) {
        throw "Unsupported configuration -- cannot show percentage change for single value";
      }
      if (this.options.timeWindow === CovidNumberCaseTimeWindow.twentyFourhours) {
        const last = combined[0];
        const prev = combined[1];
        if (this.options.type === CovidNumberCaseType.cases) {
          if (this.options.normalization === CovidNumberCaseNormalization.absolut) {
            return ((last.cases - prev.cases) / prev.cases) * 100 || 0;
          } else {
            return (((last.cases - prev.cases) / prev.cases) * 100 || 0) / last.bevoelkerung;
          }
        }
        if (this.options.normalization === CovidNumberCaseNormalization.absolut) {
          return ((last.deaths - prev.deaths) / prev.deaths) * 100 || 0;
        } else {
          return (((last.deaths - prev.deaths) / prev.deaths) * 100 || 0) / last.bevoelkerung;
        }
      }
      if (this.options.timeWindow === CovidNumberCaseTimeWindow.seventyTwoHours) {
        const last = combined[0];
        const prev = combined[2];
        if (this.options.type === CovidNumberCaseType.cases) {
          if (this.options.normalization === CovidNumberCaseNormalization.absolut) {
            return ((last.cases - prev.cases) / prev.cases) * 100 || 0;
          } else {
            return (((last.cases - prev.cases) / prev.cases) * 100 || 0) / last.bevoelkerung;
          }
        }
        if (this.options.normalization === CovidNumberCaseNormalization.absolut) {
          return ((last.deaths - prev.deaths) / prev.deaths) * 100 || 0;
        } else {
          return (((last.deaths - prev.deaths) / prev.deaths) * 100 || 0) / last.bevoelkerung;
        }
      }
    }
  }

  createOverlay() {
    const cases = this.featureCollection.features.map(d => this.getCaseNumbers(d.properties));

    let normalizeValues;
    if (this.options.change === CovidNumberCaseChange.absolute) {
      normalizeValues = d3.scalePow().exponent(0.33)
        .domain([0, d3.max(cases, d => d)])
        .range([0, 1]);
    } else {
      const [minChange, maxChange] = d3.extent(cases.filter(d => d < Infinity));
      const max = Math.max(Math.abs(minChange), Math.abs(maxChange));
      normalizeValues = d3.scaleLinear()
        .domain([-max, max])
        .range([1, 0])
        .clamp(true);
    }


    // create geojson layer (looks more complex than it is)
    const aggregationLayer = L.geoJSON(this.featureCollection, {
      style: (feature) => {
        let color;
        if (this.options.change === CovidNumberCaseChange.absolute) {
          color = this.options.type === CovidNumberCaseType.cases ?
            this.colorsService.getCaseColor(normalizeValues(this.getCaseNumbers(feature.properties))) :
            this.colorsService.getDeathsColor(normalizeValues(this.getCaseNumbers(feature.properties)));
        } else {
          color = this.colorsService.getDiff(normalizeValues(this.getCaseNumbers(feature.properties)))
        }
        return {
          fillColor: color,
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
          mouseover: (e: L.LeafletMouseEvent) => {

            const tooltipComponent = this.tooltipService
              .openAtElementRef(CaseTooltipComponent, {x: e.originalEvent.clientX, y: e.originalEvent.clientY});

            tooltipComponent.name = feature.properties.name;
            tooltipComponent.combined = feature.properties.combined;
            tooltipComponent.datum = feature.properties.until;
            tooltipComponent.einwohner = +feature.properties.bevoelkerung

            // set highlight style
            const l = e.target;
            l.setStyle({
              weight: 3,
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
