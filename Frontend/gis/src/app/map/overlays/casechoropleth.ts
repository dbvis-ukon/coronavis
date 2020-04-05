import * as d3 from "d3";
import * as L from 'leaflet';
import { QuantitativeAggregatedRkiCaseNumberProperties } from 'src/app/repositories/types/in/quantitative-aggregated-rki-cases';
import { QualitativeColormapService } from 'src/app/services/qualitative-colormap.service';
import { QuantitativeAggregatedRkiCasesOverTime, QuantitativeAggregatedRkiCasesOverTimeProperties } from 'src/app/services/types/quantitative-aggregated-rki-cases-over-time';
import { CaseTooltipComponent } from "../../case-tooltip/case-tooltip.component";
import { TooltipService } from "../../services/tooltip.service";
import { CovidNumberCaseChange, CovidNumberCaseNormalization, CovidNumberCaseOptions, CovidNumberCaseTimeWindow, CovidNumberCaseType } from '../options/covid-number-case-options';
import { Overlay } from './overlay';

export class CaseChoropleth extends Overlay<QuantitativeAggregatedRkiCasesOverTime> {
  private typeAccessor: (d: QuantitativeAggregatedRkiCaseNumberProperties) => number;
  private timeAccessor: (d: QuantitativeAggregatedRkiCasesOverTimeProperties) => QuantitativeAggregatedRkiCaseNumberProperties;

  constructor(
    name: string,
    hospitals: QuantitativeAggregatedRkiCasesOverTime,
    private options: CovidNumberCaseOptions,
    private tooltipService: TooltipService,
    private colorsService: QualitativeColormapService
  ) {
    super(name, hospitals);

    switch (this.options.type) {
      case CovidNumberCaseType.cases:
        this.typeAccessor = d => d.cases;
        break;
      case CovidNumberCaseType.deaths:
        this.typeAccessor = d => d.deaths;
        break;
    }

    switch (this.options.timeWindow) {
      case CovidNumberCaseTimeWindow.all:
        this.timeAccessor = d => d.last;
        break;
      case CovidNumberCaseTimeWindow.twentyFourhours:
        this.timeAccessor = d => d.yesterday;
        break;
      case CovidNumberCaseTimeWindow.seventyTwoHours:
        this.timeAccessor = d => d.threeDaysAgo;
        break;
    }

  }

  private minMaxValues: [number, number];
  private minMaxNormValues: [number, number];
  private normalizeValues;

  private getCaseNumbers(data: QuantitativeAggregatedRkiCasesOverTimeProperties): number {
    const prev = this.typeAccessor(this.timeAccessor(data));
    const now = this.typeAccessor(data.last);

    let unnormalizedResult = 0;
    if (this.options.change === CovidNumberCaseChange.absolute) {
      if (this.options.timeWindow === CovidNumberCaseTimeWindow.all) {
        unnormalizedResult = now;
      } else {
        unnormalizedResult = now - prev;
      }
    } else {
      if (this.options.timeWindow === CovidNumberCaseTimeWindow.all) {
        throw "Unsupported configuration -- cannot show percentage change for single value";
      }
      unnormalizedResult = ((now - prev) / prev) * 100 || 0;
    }

    return this.options.normalization === CovidNumberCaseNormalization.absolut ?
      unnormalizedResult :
      unnormalizedResult / data.bevoelkerung;
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

      // l.bringToFront();
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
