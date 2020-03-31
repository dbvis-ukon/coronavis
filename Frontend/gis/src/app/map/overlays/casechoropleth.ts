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
import {
  QuantitativeAggregatedRkiCaseNumberProperties,
  QuantitativeAggregatedRkiCases,
  QuantitativeAggregatedRkiCasesOverTime, QuantitativeAggregatedRkiCasesOverTimeProperties,
  QuantitativeAggregatedRkiCasesProperties
} from 'src/app/repositories/types/in/quantitative-aggregated-rki-cases';

export class CaseChoropleth extends Overlay<QuantitativeAggregatedRkiCasesOverTime> {
  constructor(
    name: string,
    hospitals: QuantitativeAggregatedRkiCasesOverTime,
    private options: CovidNumberCaseOptions,
    private tooltipService: TooltipService,
    private colorsService: ColormapService
  ) {
    super(name, hospitals);
  }

  private minMaxValues: [number, number];
  private minMaxNormValues: [number, number];
  private normalizeValues;


  private getCaseNumbers(data: QuantitativeAggregatedRkiCasesOverTimeProperties): number {
    if (this.options.change === CovidNumberCaseChange.absolute) {
      if (this.options.timeWindow === CovidNumberCaseTimeWindow.all) {
        if (this.options.type === CovidNumberCaseType.cases) {
          if (this.options.normalization === CovidNumberCaseNormalization.absolut) {
            return data.last.cases;
          } else {
            return data.last.cases / data.bevoelkerung;
          }
        }
        if (this.options.normalization === CovidNumberCaseNormalization.absolut) {
          return data.last.deaths;
        } else {
          return data.last.deaths / data.bevoelkerung;
        }
      }
      if (this.options.timeWindow === CovidNumberCaseTimeWindow.twentyFourhours) {
        if (this.options.type === CovidNumberCaseType.cases) {
          if (this.options.normalization === CovidNumberCaseNormalization.absolut) {
            return data.last.cases - data.yesterday.cases;
          } else {
            return (data.last.cases - data.yesterday.cases) / data.bevoelkerung;
          }
        }
        if (this.options.normalization === CovidNumberCaseNormalization.absolut) {
          return data.last.deaths - data.yesterday.deaths;
        } else {
          return (data.last.deaths - data.yesterday.deaths) / data.bevoelkerung;
        }
      }
      if (this.options.timeWindow === CovidNumberCaseTimeWindow.seventyTwoHours) {
        if (this.options.type === CovidNumberCaseType.cases) {
          if (this.options.normalization === CovidNumberCaseNormalization.absolut) {
            return data.last.cases - data.threeDaysAgo.cases;
          } else {
            return (data.last.cases - data.threeDaysAgo.cases) / data.bevoelkerung;
          }
        }
        if (this.options.normalization === CovidNumberCaseNormalization.absolut) {
          return data.last.deaths - data.threeDaysAgo.deaths;
        } else {
          return (data.last.deaths - data.threeDaysAgo.deaths) / data.bevoelkerung;
        }
      }
    } else {
      if (this.options.timeWindow === CovidNumberCaseTimeWindow.all) {
        throw "Unsupported configuration -- cannot show percentage change for single value";
      }
      if (this.options.timeWindow === CovidNumberCaseTimeWindow.twentyFourhours) {
        if (this.options.type === CovidNumberCaseType.cases) {
          if (this.options.normalization === CovidNumberCaseNormalization.absolut) {
            return ((data.last.cases - data.yesterday.cases) / data.yesterday.cases) * 100 || 0;
          } else {
            return (((data.last.cases - data.yesterday.cases) / data.yesterday.cases) * 100 || 0) / data.bevoelkerung;
          }
        }
        if (this.options.normalization === CovidNumberCaseNormalization.absolut) {
          return ((data.last.deaths - data.yesterday.deaths) / data.yesterday.deaths) * 100 || 0;
        } else {
          return (((data.last.deaths - data.yesterday.deaths) / data.yesterday.deaths) * 100 || 0) / data.bevoelkerung;
        }
      }
      if (this.options.timeWindow === CovidNumberCaseTimeWindow.seventyTwoHours) {
        if (this.options.type === CovidNumberCaseType.cases) {
          if (this.options.normalization === CovidNumberCaseNormalization.absolut) {
            return ((data.last.cases - data.threeDaysAgo.cases) / data.threeDaysAgo.cases) * 100 || 0;
          } else {
            return (((data.last.cases - data.threeDaysAgo.cases) / data.threeDaysAgo.cases) * 100 || 0) / data.bevoelkerung;
          }
        }
        if (this.options.normalization === CovidNumberCaseNormalization.absolut) {
          return ((data.last.deaths - data.threeDaysAgo.deaths) / data.threeDaysAgo.deaths) * 100 || 0;
        } else {
          return (((data.last.deaths - data.threeDaysAgo.deaths) / data.threeDaysAgo.deaths) * 100 || 0) / data.bevoelkerung;
        }
      }
    }
  }

  public get MinMax(): [number, number] {
    return this.minMaxValues;
  }

  public get NormMinMax(): [number, number] {
    return this.minMaxNormValues;
  }

  public get NormValuesFunc() {
    return this.normalizeValues;
  }

  createOverlay() {
    const cases = this.featureCollection.features.map(d => this.getCaseNumbers(d.properties));

    if (this.options.change === CovidNumberCaseChange.absolute) {
      this.minMaxValues = [0, d3.max(cases, d => d)];
      this.minMaxNormValues = [0, 1];
      this.normalizeValues = d3.scalePow().exponent(0.33)
        .domain(this.minMaxValues)
        .range(this.minMaxNormValues);
    } else {
      const [minChange, maxChange] = d3.extent(cases.filter(d => d < Infinity));
      const max = Math.max(Math.abs(minChange), Math.abs(maxChange));
      this.minMaxValues = [-max, max];
      this.minMaxNormValues = [-1, 1];
      this.normalizeValues = d3.scaleLinear()
        .domain(this.minMaxValues)
        .range(this.minMaxNormValues)
        .clamp(true);
    }

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

      l.bringToFront();
    };


    // create geojson layer (looks more complex than it is)
    const aggregationLayer = L.geoJSON(this.featureCollection, {
      style: (feature) => {
        return {
          fillColor: this.colorsService.getChoroplethCaseColor(this.normalizeValues(this.getCaseNumbers(feature.properties))),
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
