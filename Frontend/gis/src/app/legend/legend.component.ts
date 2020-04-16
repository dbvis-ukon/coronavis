import { DecimalPipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { BedType } from '../map/options/bed-type.enum';
import { CovidNumberCaseChange, CovidNumberCaseNormalization, CovidNumberCaseTimeWindow, CovidNumberCaseType } from '../map/options/covid-number-case-options';
import { MapOptions } from '../map/options/map-options';
import { CaseChoropleth } from '../map/overlays/casechoropleth';
import { PlusminusPipe } from '../plusminus.pipe';
import { CaseChoroplethColormapService, ColorMapBin } from '../services/case-choropleth-colormap.service';
import { I18nService, SupportedLocales } from '../services/i18n.service';
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

  title: string;

  constructor(
    private bedColormap: QualitativeColormapService,
    private caseColormap: CaseChoroplethColormapService,
    private plusMinusPipe: PlusminusPipe,
    private numberPipe: DecimalPipe,
    private i18n: I18nService
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

    this.title = this.getTitle();
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

  getTitle(): string {
    return this.i18n.getCurrentLocale() === SupportedLocales.DE_DE ? this.getTitleDe() : this.getTitleEn();
  }

  getTitleEn() {
    let title = '';

    if(this.mo.covidNumberCaseOptions.timeWindow !== CovidNumberCaseTimeWindow.all) {
      if(this.mo.covidNumberCaseOptions.change === CovidNumberCaseChange.relative) {
        title += "Percentage change";
      } else {
        title += "Change"
      }

      title += this.mo.covidNumberCaseOptions.timeWindow === CovidNumberCaseTimeWindow.twentyFourhours ? " (24h)" : " (72h)";

      title += " of ";
    }

    title += this.mo.covidNumberCaseOptions.type === CovidNumberCaseType.cases ? "Covid-19 afflictions" : "Covid-19 deaths"


    if(this.mo.covidNumberCaseOptions.normalization === CovidNumberCaseNormalization.per100k) {
      title += ` per ${this.numberPipe.transform(100000)} residents`;
    }

    title += " per "

    switch(this.mo.covidNumberCaseOptions.aggregationLevel) {
      case AggregationLevel.county:
        title += "county";
        break;
      
      case AggregationLevel.governmentDistrict:
        title += "district";
        break;

      case AggregationLevel.state:
        title += "state";
        break;
    }

    return title;
  }

  getTitleDe() {
    let title = '';

    if(this.mo.covidNumberCaseOptions.timeWindow !== CovidNumberCaseTimeWindow.all) {
      if(this.mo.covidNumberCaseOptions.change === CovidNumberCaseChange.relative) {
        title += "Prozentuale ";
      }

      title += "Veränderung"

      title += this.mo.covidNumberCaseOptions.timeWindow === CovidNumberCaseTimeWindow.twentyFourhours ? " (24h)" : " (72h)";

      title += " der ";
    }

    title += this.mo.covidNumberCaseOptions.type === CovidNumberCaseType.cases ? "Covid-19 Erkrankungen" : "Covid-19 Todesfälle"


    if(this.mo.covidNumberCaseOptions.normalization === CovidNumberCaseNormalization.per100k) {
      title += ` je ${this.numberPipe.transform(100000)} Einwohner`;
    }

    title += " pro "

    switch(this.mo.covidNumberCaseOptions.aggregationLevel) {
      case AggregationLevel.county:
        title += "Landkreis";
        break;
      
      case AggregationLevel.governmentDistrict:
        title += "Regierungsbezirk";
        break;

      case AggregationLevel.state:
        title += "Bundesland";
        break;
    }

    return title;
  }

}
