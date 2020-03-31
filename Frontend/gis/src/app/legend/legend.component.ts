import {Component, Input, OnInit} from '@angular/core';
import {QuantitativeColormapService} from '../services/quantiataive-colormap.service';
import {AggregationLevel} from '../map/options/aggregation-level.enum';
import {BedType} from '../map/options/bed-type.enum';
import { CaseChoropleth } from '../map/overlays/casechoropleth';
import { CovidNumberCaseOptions, CovidNumberCaseNormalization } from '../map/options/covid-number-case-options';
import { MapOptions } from '../map/options/map-options';

@Component({
  selector: 'app-legend',
  templateUrl: './legend.component.html',
  styleUrls: ['./legend.component.less']
})
export class LegendComponent implements OnInit {

  @Input('mapOptions')
  mo: MapOptions;

  agg = AggregationLevel;
  bed = BedType;

  bedStatusColors = QuantitativeColormapService.bedStati;

  private _choroplethLayer: CaseChoropleth;

  @Input()
  set choroplethLayer(v: CaseChoropleth) {
    this._choroplethLayer = v;

    this.updateCaseColors();
  }

  get choroplethLayer(): CaseChoropleth {
    return this._choroplethLayer;
  }

  caseColors = [];

  constructor(private colmapService: QuantitativeColormapService) {

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

    const norm100k: boolean = this.mo.covidNumberCaseOptions.normalization === CovidNumberCaseNormalization.per100k;
    const v = this._choroplethLayer;
    let normVal = 1;
    if ((this.mo.covidNumberCaseOptions && norm100k)) {
      normVal = 100000;
    }

    const cmap = QuantitativeColormapService.CChoroplethColorMap;

    let lastColor = true;
    let prevColor;
    let prevD;

    let decimals: number = 0;

    const doneMap = new Map<number, boolean>();
  
    cmap.range().map((color, i) => {
      const d = cmap.invertExtent(color);

      d[0] = v.NormValuesFunc.invert(d[0]);
      d[1] = v.NormValuesFunc.invert(d[1]);

      let d0Fixed = (d[0] * normVal);
      let d1Fixed = (d[1] * normVal);

      // Calculate number of appropriate decimals:
      while (d0Fixed.toFixed(decimals) === d1Fixed.toFixed(decimals)) {
        decimals++; // Keep this decimals level for all following  steps
      }

      d0Fixed = +d0Fixed.toFixed(decimals);
      d1Fixed = +d1Fixed.toFixed(decimals);

      const d0Ceil = Math.ceil(d0Fixed);
      const d1Ceil = Math.ceil(d1Fixed);

      let text = d0Fixed + ((d[1]) ? ' &ndash; ' + d1Fixed : '+' );

      if (!norm100k) {
        if (d1Fixed - d0Fixed < 1) {
          if (d0Ceil === d1Ceil && !doneMap.get(d0Ceil)) {
            doneMap.set(d0Ceil, true);
            text = Math.floor(d0Fixed) + '';
          } else if (d1Ceil === d1Fixed) {
            text = d1Ceil + '';
          } else {
            return;
          }                    
        } else {
          if (d0Ceil === d1Ceil) {
            text = d1Ceil + '';
          } else {
            text = d0Ceil + ' &ndash; ' + d1Ceil;
          } 
        }        
      }

      if (v.MinMax[0] < d[0] && v.MinMax[1] > d[1] ) {

        this.caseColors.push(
          {
            color: color,
            text: text
          }
        );

      }
      if (v.MinMax[1] <= d[1] && lastColor) {
        lastColor = false;

        this.caseColors.push(
          {
            color: color,
            text: text
          }
        );

      }
      prevColor = color;
      prevD = d;
    });
  }

}
