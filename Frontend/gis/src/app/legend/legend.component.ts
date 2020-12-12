import { BreakpointObserver } from '@angular/cdk/layout';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { BedType } from '../map/options/bed-type.enum';
import { CovidNumberCaseChange, CovidNumberCaseNormalization, CovidNumberCaseTimeWindow, CovidNumberCaseType } from '../map/options/covid-number-case-options';
import { MapOptions } from '../map/options/map-options';
import { CaseChoropleth } from '../map/overlays/casechoropleth';
import { CaseChoroplethColormapService, ColorMapBin } from '../services/case-choropleth-colormap.service';
import { I18nService, SupportedLocales } from '../services/i18n.service';
import { QualitativeColormapService } from '../services/qualitative-colormap.service';
import { QuantitativeColormapService } from '../services/quantitative-colormap.service';
import { PlusminusPipe } from '../shared/plusminus.pipe';
import { getMoment } from '../util/date-util';

interface LegendColorMapBin extends ColorMapBin {
  minStr: string;

  maxStr: string;

  originalMin?: number;
  originalMax?: number;
}

@Component({
  selector: 'app-legend',
  templateUrl: './legend.component.html',
  styleUrls: ['./legend.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegendComponent implements OnInit, OnDestroy {

  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('mapOptions$')
  mo$: Observable<MapOptions>;

  @Input()
  choroplethLayer$: Observable<CaseChoropleth>;

  @Output()
  mapOptionsChange: EventEmitter<MapOptions> = new EventEmitter();

  agg = AggregationLevel;
  bed = BedType;

  legendCasesExtended = true;
  legendBedsExtended = true;

  bedStatusColors = QuantitativeColormapService.bedStati;
  bedStatusIcons = {
    Verfügbar: 'V',
    Begrenzt: 'B',
    Ausgelastet: 'A',
    'Nicht verfügbar': '–',
    'Keine Information': '?'
  };

  caseBins$: Observable<LegendColorMapBin[]>;

  titleBeds$: Observable<string>;
  titleCases$: Observable<string>;

  optionsSubscription: Subscription;
  currentOptions: MapOptions;

  constructor(
    private bedColormap: QualitativeColormapService,
    public caseColormap: CaseChoroplethColormapService,
    private plusMinusPipe: PlusminusPipe,
    private numberPipe: DecimalPipe,
    private i18n: I18nService,
    private datePipe: DatePipe,
    private breakpointObs: BreakpointObserver
  ) {

  }
  ngOnDestroy(): void {
    if (this.optionsSubscription) {
      this.optionsSubscription.unsubscribe();
    }
  }

  ngOnInit(): void {
    this.legendBedsExtended = this.legendCasesExtended = !this.breakpointObs.isMatched('only screen and (max-width: 499px)');

    this.optionsSubscription = this.mo$.subscribe(c => this.currentOptions = c);

    this.titleCases$ = this.mo$
    .pipe(
      // tap(m => console.log('new mo', m)),
      // distinctUntilChanged((a, b) => JSON.stringify(a?.covidNumberCaseOptions) === JSON.stringify(b?.covidNumberCaseOptions)),
      // tap(m => console.log('changed!')),
      map(mo => this.getTitleCases(mo))
    );

    this.titleBeds$ = this.mo$
    .pipe(map(mo => this.getTitleBeds(mo)));

    this.caseBins$ = combineLatest([this.mo$, this.choroplethLayer$])
    .pipe(
      // distinctUntilChanged(([a], [b]) => !isEqual(a?.covidNumberCaseOptions, b?.covidNumberCaseOptions)),
      map(([mo, c]) => this.updateCaseColors(mo, c))
    );
  }

  getBedColor(bedType: string) {
    return this.bedColormap.getSingleHospitalColormap()(bedType);
  }

  updateCaseColors(mo: MapOptions, choropleth: CaseChoropleth): LegendColorMapBin[] {
    let caseBins = [];

    if (!choropleth || !mo) {
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

    caseBins = this.caseColormap.getColorMapBins(mo.covidNumberCaseOptions, scale, fullNumbers, actualExtent)
    .map(b => {
      if (mo.covidNumberCaseOptions.normalization === CovidNumberCaseNormalization.per100k && mo.covidNumberCaseOptions.change === CovidNumberCaseChange.absolute) {
        return {
          color: b.color,
          originalMin: b.min,
          originalMax: b.max,
          min: b.min * 100000,
          max: b.max * 100000
        };
      }

      // else
      return b;
    })
    .map(b => {
      return {
        ...b,
        minStr: this.getBinStr(b.min, mo),
        maxStr: this.getBinStr(b.max, mo)
      };
    });

    return caseBins;
  }

  hoverBin(bin?: LegendColorMapBin | null) {
    if (!this.currentOptions) {
      return;
    }

    const b = this.getBinTuple(bin);


    if ((!this.currentOptions.covidNumberCaseOptions._binHovered && !b) || (b && this.currentOptions.covidNumberCaseOptions._binHovered && this.currentOptions.covidNumberCaseOptions._binHovered[0] === b[0] && this.currentOptions.covidNumberCaseOptions._binHovered[1] === b[1])) {
      return;
    }

    this.currentOptions.covidNumberCaseOptions._binHovered = b;

    this.mapOptionsChange.emit({... this.currentOptions});
  }

  isBinHovered(bin: LegendColorMapBin): boolean {
    if (!this.currentOptions) {
      return false;
    }

    const b = this.getBinTuple(bin);

    const c = this.currentOptions.covidNumberCaseOptions._binHovered;

    return c && c[0] === b[0] && c[1] === b[1];
  }

  selectBin(bin: LegendColorMapBin) {
    if (!this.currentOptions) {
      return;
    }

    const b = this.getBinTuple(bin);

    const idx = this.getSelectionIdx(bin);

    if (idx > -1) {
      this.currentOptions.covidNumberCaseOptions._binSelection.splice(idx, 1);
    } else {
      if (!this.currentOptions.covidNumberCaseOptions._binSelection) {
        this.currentOptions.covidNumberCaseOptions._binSelection = [];
      }

      this.currentOptions.covidNumberCaseOptions._binSelection.push(b);
    }

    if (this.currentOptions.covidNumberCaseOptions._binSelection.length === 0) {
      this.currentOptions.covidNumberCaseOptions._binSelection = null;
    }

    this.currentOptions.covidNumberCaseOptions._binHovered = null;

    this.mapOptionsChange.emit({... this.currentOptions});
  }

  getSelectionIdx(bin: LegendColorMapBin): number {
    if (!this.currentOptions?.covidNumberCaseOptions?._binSelection) {
      return -1;
    }

    const b = this.getBinTuple(bin);

    return this.currentOptions.covidNumberCaseOptions._binSelection.findIndex(d => b[0] === d[0] && b[1] === d[1]);
  }

  isBinSelected(bin: LegendColorMapBin): boolean {
    return this.getSelectionIdx(bin) > -1;
  }

  clearSelection() {
    this.currentOptions.covidNumberCaseOptions._binSelection = null;

    this.mapOptionsChange.emit({... this.currentOptions});
  }

  private getBinTuple(bin: LegendColorMapBin): [number, number] | null {
    return bin ? [bin.originalMin || bin.min, bin.originalMax || bin.max] : null;
  }

  private getBinStr(v: number, mo: MapOptions): string {
    if (mo.covidNumberCaseOptions.change === CovidNumberCaseChange.relative) {
      return `${v > 0 ? '+' : ''}${this.numberPipe.transform(v, '1.0-1')} %`;
    }

    if (mo.covidNumberCaseOptions.timeWindow !== CovidNumberCaseTimeWindow.all) {
      return this.plusMinusPipe.transform(v, '1.0-2');
    }


    return this.numberPipe.transform(v, '1.0-1');
  }

  private getTitleBeds(mo: MapOptions): string {
    return this.i18n.getCurrentLocale() === SupportedLocales.DE_DE ? this.getTitleBedsDe(mo) : this.getTitleBedsEn(mo);
  }

  private getTitleBedsEn(mo: MapOptions): string {
    let title = 'Bed Capacity';

    if (mo.bedBackgroundOptions.enabled) {
      switch (mo.bedBackgroundOptions.bedType) {
        case BedType.icuLow:
          title += ' ICU low';
          break;

        case BedType.icuHigh:
          title += ' ICU high';
          break;

        case BedType.ecmo:
          title += ' ECMO';
          break;
      }
    }


    title += ' by ';

    switch (mo.bedGlyphOptions.aggregationLevel) {
      case AggregationLevel.county:
        title += 'counties';
        break;

      case AggregationLevel.governmentDistrict:
        title += 'districts';
        break;

      case AggregationLevel.state:
        title += 'states';
        break;

      case AggregationLevel.country:
        title += 'Germany';
        break;

      case AggregationLevel.none:
        title += 'facilities';
        break;
    }

    title += ' on ';

    title += this.datePipe.transform(getMoment(mo.bedBackgroundOptions.date).toDate(), 'shortDate');

    return title;
  }

  private getTitleBedsDe(mo: MapOptions): string {
    let title = 'Bettenauslastung';

    if (mo.bedBackgroundOptions.enabled) {
      switch (mo.bedBackgroundOptions.bedType) {
        case BedType.icuLow:
          title += ' ICU low';
          break;

        case BedType.icuHigh:
          title += ' ICU high';
          break;

        case BedType.ecmo:
          title += ' ECMO';
          break;
      }
    }

    title += ' für ';

    switch (mo.bedGlyphOptions.aggregationLevel) {
      case AggregationLevel.county:
        title += 'Landkreise';
        break;

      case AggregationLevel.governmentDistrict:
        title += 'Regierungsbezirke';
        break;

      case AggregationLevel.state:
        title += 'Bundesländer';
        break;

      case AggregationLevel.country:
        title += 'Deutschland';
        break;

      case AggregationLevel.none:
        title += 'Einrichtungen';
        break;
    }

    title += ' am ';

    title += this.datePipe.transform(getMoment(mo.bedBackgroundOptions.date).toDate(), 'shortDate');

    return title;
  }

  private getTitleCases(mo: MapOptions): string {
    return this.i18n.getCurrentLocale() === SupportedLocales.DE_DE ? this.getTitleCasesDe(mo) : this.getTitleCasesEn(mo);
  }

  private getTitleCasesEn(mo: MapOptions) {
    let title = '';

    if (mo.covidNumberCaseOptions.timeWindow !== CovidNumberCaseTimeWindow.all) {
      if (mo.covidNumberCaseOptions.change === CovidNumberCaseChange.relative) {
        title += 'Percentage change';
      } else {
        title += 'Change';
      }

      title += ' (' + mo.covidNumberCaseOptions.timeWindow + ')';

      title += ' of ';
    }

    title += mo.covidNumberCaseOptions.type === CovidNumberCaseType.cases ? 'Covid-19 afflictions' : 'Covid-19 deaths';


    if (mo.covidNumberCaseOptions.normalization === CovidNumberCaseNormalization.per100k) {
      title += ` per ${this.numberPipe.transform(100000)} residents`;
    }

    title += ' per ';

    switch (mo.covidNumberCaseOptions.aggregationLevel) {
      case AggregationLevel.county:
        title += 'county';
        break;

      case AggregationLevel.governmentDistrict:
        title += 'district';
        break;

      case AggregationLevel.state:
        title += 'state';
        break;

      case AggregationLevel.country:
        title += 'Germany';
        break;
    }

    if (mo.covidNumberCaseOptions.timeWindow === CovidNumberCaseTimeWindow.all) {
      title += ' until ';
    } else {
      title += ' on ';
    }

    title += this.datePipe.transform(getMoment(mo.covidNumberCaseOptions.date).toDate(), 'shortDate');

    return title;
  }

  private getTitleCasesDe(mo: MapOptions) {
    let title = '';

    if (mo.covidNumberCaseOptions.timeWindow !== CovidNumberCaseTimeWindow.all) {
      if (mo.covidNumberCaseOptions.change === CovidNumberCaseChange.relative) {
        title += 'Prozentuale ';
      }

      title += 'Veränderung';

      title += ' (' + mo.covidNumberCaseOptions.timeWindow + ')';

      title += ' der ';
    }

    title += mo.covidNumberCaseOptions.type === CovidNumberCaseType.cases ? 'Covid-19 Positiv Getestet' : 'Covid-19 Todesfälle';


    if (mo.covidNumberCaseOptions.normalization === CovidNumberCaseNormalization.per100k) {
      title += ` je ${this.numberPipe.transform(100000)} Einwohner`;
    }

    title += ' pro ';

    switch (mo.covidNumberCaseOptions.aggregationLevel) {
      case AggregationLevel.county:
        title += 'Landkreis';
        break;

      case AggregationLevel.governmentDistrict:
        title += 'Regierungsbezirk';
        break;

      case AggregationLevel.state:
        title += 'Bundesland';
        break;

      case AggregationLevel.country:
        title += 'Deutschland';
        break;
    }

    if (mo.covidNumberCaseOptions.timeWindow === CovidNumberCaseTimeWindow.all) {
      title += ' bis ';
    } else {
      title += ' am ';
    }

    title += this.datePipe.transform(getMoment(mo.covidNumberCaseOptions.date).toDate(), 'shortDate');

    return title;
  }

}
