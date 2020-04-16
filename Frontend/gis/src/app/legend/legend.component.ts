import { DecimalPipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { BedType } from '../map/options/bed-type.enum';
import { CovidNumberCaseChange, CovidNumberCaseNormalization, CovidNumberCaseTimeWindow } from '../map/options/covid-number-case-options';
import { MapOptions } from '../map/options/map-options';
import { CaseChoropleth } from '../map/overlays/casechoropleth';
import { PlusminusPipe } from '../plusminus.pipe';
import { CaseChoroplethColormapService, ColorMapBin } from '../services/case-choropleth-colormap.service';
import { QualitativeColormapService } from '../services/qualitative-colormap.service';
import { QuantitativeColormapService } from '../services/quantitative-colormap.service';

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
  
  legendCasesExtended = true;
  legendBedsExtended = true;

  bedStatusColors = QuantitativeColormapService.bedStati;
  bedStatusIcons = {
    'Verfügbar': 'V',
    'Begrenzt': 'B',
    'Ausgelastet': 'A',
    'Nicht verfügbar': '–',
    'Keine Information': '?'
  };

  private _choroplethLayer: CaseChoropleth;

  @Input()
  set choroplethLayer(v: CaseChoropleth) {
    this._choroplethLayer = v;

    this.updateCaseColors();
  }

  get choroplethLayer(): CaseChoropleth {
    return this._choroplethLayer;
  }

  caseBins: ColorMapBin[] = [];

  eTime = CovidNumberCaseTimeWindow;

  eChange = CovidNumberCaseChange;

  constructor(
    private bedColormap: QualitativeColormapService,
    private caseColormap: CaseChoroplethColormapService,
    private plusMinusPipe: PlusminusPipe,
    private numberPipe: DecimalPipe
  ) {
    
  }

  ngOnInit(): void {
  }

  getBedColor(bedType: string) {
    return this.bedColormap.getSingleHospitalColormap()(bedType);
  }

  updateCaseColors() {
    this.caseBins = [];

    if(!this._choroplethLayer) {
      return;
    }

    // FIXME: Ugly hack to get the data
    // needs to be refactored in the future
    // so that the legend receives the data directly
    const data = this._choroplethLayer.getData();

    const scale = this.caseColormap.getScale(data, this.mo.covidNumberCaseOptions);

    const actualExtent = this.caseColormap.getDomainExtent(data, this.mo.covidNumberCaseOptions, true);

    console.log('new logic', this.caseColormap.getColorMapBins(scale));

    const fullNumbers = this.mo.covidNumberCaseOptions.normalization === CovidNumberCaseNormalization.absolut 
    && this.mo.covidNumberCaseOptions.change === CovidNumberCaseChange.absolute;

    this.caseBins = this.caseColormap.getColorMapBins(scale, fullNumbers, actualExtent)
    .map(b => {
      if(this.mo.covidNumberCaseOptions.normalization === CovidNumberCaseNormalization.per100k && this.mo.covidNumberCaseOptions.change === CovidNumberCaseChange.absolute) {
        return {
          color: b.color,
          min: b.min * 100000,
          max: b.max * 100000
        }
      }

      // else 
      return b;
    });

    console.log('bins w/o full numbers', this.caseColormap.getColorMapBins(scale, false, actualExtent));

    console.log('bins', actualExtent, this.caseBins);

    // const domainMinMax = this.caseColormap.getDomainExtent(data, this.mo.covidNumberCaseOptions);


    // const norm100k: boolean = this.mo.covidNumberCaseOptions.normalization === CovidNumberCaseNormalization.per100k;
    // let normVal = 1;
    // if ((this.mo.covidNumberCaseOptions && norm100k)) {
    //   normVal = 100000;
    // }

    // let lastColor = true;
    // let prevColor;
    // let prevD;

    // let decimals: number = 0;

    // const doneMap = new Map<number, boolean>();

    // this.casesMin = '';
  
    // cmap.range().map((color, i) => {
    //   const d = cmap.invertExtent(color);

    //   d[0] = scale.invert(d[0]);
    //   d[1] = scale.invert(d[1]);

    //   let d0Fixed = (d[0] * normVal);
    //   let d1Fixed = (d[1] * normVal);

    //   // Calculate number of appropriate decimals:
    //   while (d0Fixed.toFixed(decimals) === d1Fixed.toFixed(decimals)) {
    //     decimals++; // Keep this decimals level for all following  steps
    //   }

    //   d0Fixed = +d0Fixed.toFixed(decimals);
    //   d1Fixed = +d1Fixed.toFixed(decimals);
    //   this.casesMax = d1Fixed + '';

    //   const d0Ceil = Math.ceil(d0Fixed);
    //   const d1Ceil = Math.ceil(d1Fixed);

    //   let text = d0Fixed + ((d[1]) ? ' – ' + d1Fixed : '+' );

    //   let binLowerBound = d0Fixed;
    //   let binUpperBound = d1Fixed;

    //   if (!norm100k) {
    //     if (d1Fixed - d0Fixed < 1) {
    //       if (d0Ceil === d1Ceil && !doneMap.get(d0Ceil)) {
    //         doneMap.set(d0Ceil, true);
    //         binLowerBound = Math.floor(d0Fixed);
    //       } else if (d1Ceil === d1Fixed) {
    //         binUpperBound = d1Ceil;
    //       } else {
    //         return;
    //       }                    
    //     } else {
    //       if (d0Ceil === d1Ceil) {
    //         binLowerBound = d0Ceil;
    //         binUpperBound = d1Ceil;
    //       } else {
    //         binLowerBound = d0Ceil;
    //         binUpperBound = d1Ceil;
    //       } 
    //     }        
    //   }

    //   if (domainMinMax[0] < d[0] && domainMinMax[1] > d[1] ) {
    //     if (this.casesMin === '') {
    //       this.casesMin = (text === Math.floor(d0Fixed) + '' ? Math.floor(d0Fixed) : d0Fixed) + '';
    //     }
        
    //     this.caseColors.push(
    //       {
    //         color: color,
    //         text: text,
    //         binLowerBound,
    //         binUpperBound,
    //       }
    //     );

    //   }
    //   if (domainMinMax[1] <= d[1] && lastColor) {
    //     lastColor = false;

    //     this.caseColors.push(
    //       {
    //         color: color,
    //         text: text,
    //         binLowerBound,
    //         binUpperBound
    //       }
    //     );

    //   }
    //   prevColor = color;
    //   prevD = d;
    // });
  }

  getBinStr(v: number): string {
    if(this.mo.covidNumberCaseOptions.change === CovidNumberCaseChange.relative) {
      return `${v > 0 ? '+' : ''}${this.numberPipe.transform(v, '1.0-1')} %`;
    }

    if(this.mo.covidNumberCaseOptions.timeWindow !== CovidNumberCaseTimeWindow.all) {
      return this.plusMinusPipe.transform(v, '1.0-2');
    }


    return this.numberPipe.transform(v, '1.0-1');
  }

}
