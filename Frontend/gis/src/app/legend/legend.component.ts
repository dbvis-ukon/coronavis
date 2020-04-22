import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { isEqual } from 'lodash-es';
import moment from 'moment';
import { combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
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

interface LegendColorMapBin extends ColorMapBin {
  minStr: string;

  maxStr: string;
}

@Component({
  selector: 'app-legend',
  templateUrl: './legend.component.html',
  styleUrls: ['./legend.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegendComponent implements OnInit {

  @Input('mapOptions$')
  mo$: Observable<MapOptions>;

  @Input()
  choroplethLayer$: Observable<CaseChoropleth>;

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

  caseBins$: Observable<LegendColorMapBin[]>;

  title$: Observable<string>;

  constructor(
    private bedColormap: QualitativeColormapService,
    private caseColormap: CaseChoroplethColormapService,
    private plusMinusPipe: PlusminusPipe,
    private numberPipe: DecimalPipe,
    private i18n: I18nService,
    private datePipe: DatePipe
  ) {
    
  }

  ngOnInit(): void {
    this.title$ = this.mo$
    .pipe(
      distinctUntilChanged((a, b) => isEqual(a?.covidNumberCaseOptions, b?.covidNumberCaseOptions)),
      map(mo => this.getTitle(mo))
    );

    this.caseBins$ = combineLatest(this.mo$, this.choroplethLayer$)
    .pipe(
      distinctUntilChanged(([a], [b]) => isEqual(a?.covidNumberCaseOptions, b?.covidNumberCaseOptions)),
      map(([mo, c]) => this.updateCaseColors(mo, c))
    );
  }

  getBedColor(bedType: string) {
    return this.bedColormap.getSingleHospitalColormap()(bedType);
  }

  updateCaseColors(mo: MapOptions, choropleth: CaseChoropleth): LegendColorMapBin[] {
    let caseBins = [];

    if(!choropleth || !mo) {
      return null;
    }

    // FIXME: Ugly hack to get the data
    // needs to be refactored in the future
    // so that the legend receives the data directly
    const data = choropleth.getData();

    const scale = this.caseColormap.getScale(data, mo.covidNumberCaseOptions);

    const actualExtent = this.caseColormap.getDomainExtent(data, mo.covidNumberCaseOptions, true);

    const fullNumbers = mo.covidNumberCaseOptions.normalization === CovidNumberCaseNormalization.absolut 
    && mo.covidNumberCaseOptions.change === CovidNumberCaseChange.absolute;

    caseBins = this.caseColormap.getColorMapBins(scale, fullNumbers, actualExtent)
    .map(b => {
      if(mo.covidNumberCaseOptions.normalization === CovidNumberCaseNormalization.per100k && mo.covidNumberCaseOptions.change === CovidNumberCaseChange.absolute) {
        return {
          color: b.color,
          min: b.min * 100000,
          max: b.max * 100000
        }
      }

      // else 
      return b;
    })
    .map(b => {
      return {
        ...b,
        minStr: this.getBinStr(b.min, mo),
        maxStr: this.getBinStr(b.max, mo)
      }
    });

    return caseBins;
  }

  private getBinStr(v: number, mo: MapOptions): string {
    if(mo.covidNumberCaseOptions.change === CovidNumberCaseChange.relative) {
      return `${v > 0 ? '+' : ''}${this.numberPipe.transform(v, '1.0-1')} %`;
    }

    if(mo.covidNumberCaseOptions.timeWindow !== CovidNumberCaseTimeWindow.all) {
      return this.plusMinusPipe.transform(v, '1.0-2');
    }


    return this.numberPipe.transform(v, '1.0-1');
  }

  private getTitle(mo: MapOptions): string {
    return this.i18n.getCurrentLocale() === SupportedLocales.DE_DE ? this.getTitleDe(mo) : this.getTitleEn(mo);
  }

  private getTitleEn(mo: MapOptions) {
    let title = '';

    if(mo.covidNumberCaseOptions.timeWindow !== CovidNumberCaseTimeWindow.all) {
      if(mo.covidNumberCaseOptions.change === CovidNumberCaseChange.relative) {
        title += "Percentage change";
      } else {
        title += "Change"
      }

      title += mo.covidNumberCaseOptions.timeWindow === CovidNumberCaseTimeWindow.twentyFourhours ? " (24h)" : " (72h)";

      title += " of ";
    }

    title += mo.covidNumberCaseOptions.type === CovidNumberCaseType.cases ? "Covid-19 afflictions" : "Covid-19 deaths"


    if(mo.covidNumberCaseOptions.normalization === CovidNumberCaseNormalization.per100k) {
      title += ` per ${this.numberPipe.transform(100000)} residents`;
    }

    title += " per "

    switch(mo.covidNumberCaseOptions.aggregationLevel) {
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

    title += " on "

    title += this.datePipe.transform(mo.covidNumberCaseOptions.date === 'now' ? moment().toDate() : moment(mo.covidNumberCaseOptions.date).toDate(), 'shortDate');

    return title;
  }

  private getTitleDe(mo: MapOptions) {
    let title = '';

    if(mo.covidNumberCaseOptions.timeWindow !== CovidNumberCaseTimeWindow.all) {
      if(mo.covidNumberCaseOptions.change === CovidNumberCaseChange.relative) {
        title += "Prozentuale ";
      }

      title += "Veränderung"

      title += mo.covidNumberCaseOptions.timeWindow === CovidNumberCaseTimeWindow.twentyFourhours ? " (24h)" : " (72h)";

      title += " der ";
    }

    title += mo.covidNumberCaseOptions.type === CovidNumberCaseType.cases ? "Covid-19 Erkrankungen" : "Covid-19 Todesfälle"


    if(mo.covidNumberCaseOptions.normalization === CovidNumberCaseNormalization.per100k) {
      title += ` je ${this.numberPipe.transform(100000)} Einwohner`;
    }

    title += " pro "

    switch(mo.covidNumberCaseOptions.aggregationLevel) {
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

    title += " am "

    title += this.datePipe.transform(mo.covidNumberCaseOptions.date === 'now' ? moment().toDate() : moment(mo.covidNumberCaseOptions.date).toDate(), 'shortDate');

    return title;
  }

}
