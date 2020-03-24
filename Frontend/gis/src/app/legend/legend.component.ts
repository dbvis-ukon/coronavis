import {Component, Input, OnInit} from '@angular/core';
import {ColormapService} from '../services/colormap.service';
import {AggregationLevel} from '../map/options/aggregation-level';
import {GlyphState} from '../map/options/glyph-state';
import { CaseChoropleth } from '../map/overlays/casechoropleth';
import { CovidNumberCaseOptions, CovidNumberCaseNormalization } from '../map/options/covid-number-case-options';

@Component({
  selector: 'app-legend',
  templateUrl: './legend.component.html',
  styleUrls: ['./legend.component.less']
})
export class LegendComponent implements OnInit {

  /**
  private _aggregationLevel: AggregationLevel;
  private _bedStatus: GlyphState;

  @Input()
  set aggregationLevel(val: AggregationLevel) {
    this._aggregationLevel = val;
  }

  get aggregationLevel(): AggregationLevel {
    return this._aggregationLevel;
  }

  @Input()
  set bedType(state: GlyphState) {
    this._bedStatus = state;
  }

  get bedType(): GlyphState {
    return this._bedStatus;
  }
   **/

  @Input()
  bedType: GlyphState;

  @Input()
  aggregationLevel: AggregationLevel;

  agg = AggregationLevel;
  bed = GlyphState;

  bedStatusColors = ColormapService.bedStati;

  private _choroplethLayer: CaseChoropleth;

  @Input()
  set choroplethLayer(v: CaseChoropleth) {
    this._choroplethLayer = v;

    this.updateCaseColors();
  }

  get choroplethLayer(): CaseChoropleth {
    return this._choroplethLayer;
  }

  @Input()
  caseChoroplethOptions: CovidNumberCaseOptions;


  caseColors = [];

  constructor(private colmapService: ColormapService) {

  }

  ngOnInit(): void {
  }

  getBedColor(bedType: string) {
    return this.colmapService.getSingleHospitalColormap()(bedType);
  }

  updateCaseColors() {
    this.caseColors = [];

    if(!this._choroplethLayer) {
      return;
    }

    const v = this._choroplethLayer;
    let normVal = 1;
    if ((this.caseChoroplethOptions && this.caseChoroplethOptions.normalization === CovidNumberCaseNormalization.per100k)) {
      normVal = 100000;
    }

    const cmap = ColormapService.CChoroplethColorMap;

    let lastColor = true;
    let prevColor;
    let prevD;

    

    cmap.range().map((color, i) => {
      const d = cmap.invertExtent(color);

      d[0] = v.NormValuesFunc.invert(d[0]);
      d[1] = v.NormValuesFunc.invert(d[1]);

      const d0Fixed = (d[0] * normVal).toFixed(0);
      const d1Fixed = (d[1] * normVal).toFixed(0);
      if (v.MinMax[0] < d[0] && v.MinMax[1] > d[1] ) {

        this.caseColors.push(
          {
            color: color,
            text: d0Fixed + ((d[1]) ? ' &ndash; ' + d1Fixed : '+' )
          }
        );

      }
      if (v.MinMax[1] <= d[1] && lastColor) {
        lastColor = false;

        this.caseColors.push(
          {
            color: color,
            text: d0Fixed + ((d[1]) ? ' &ndash; ' + d1Fixed : '+' )
          }
        );

      }
      prevColor = color;
      prevD = d;
    });
  }

}
