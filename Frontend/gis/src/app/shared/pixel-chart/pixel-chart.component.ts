import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { TimeGranularity } from 'src/app/cases-dod/covid-chart-options';
import { CovidNumberCaseType } from 'src/app/map/options/covid-number-case-options';
import { PixelChartDataAndOptions, VegaPixelchartService } from 'src/app/services/vega-pixelchart.service';

@Component({
  selector: 'app-pixel-chart',
  templateUrl: './pixel-chart.component.html',
  styleUrls: ['./pixel-chart.component.less']
})
export class PixelChartComponent implements OnInit {

  @ViewChild('i18nAltersgruppe', {static: true})
  i18nAltersgruppe: ElementRef<HTMLSpanElement>;

  @ViewChild('i18nDatum', {static: true})
  i18nDatum: ElementRef<HTMLSpanElement>;

  @ViewChild('i18nWoche', {static: true})
  i18nWoche: ElementRef<HTMLSpanElement>;

  @ViewChild('i18nVal', {static: true})
  i18nVal: ElementRef<HTMLSpanElement>;

  @ViewChild('i18nValDeaths', {static: true})
  i18nValDeaths: ElementRef<HTMLSpanElement>;

  @ViewChild('i18nValAbs', {static: true})
  i18nValAbs: ElementRef<HTMLSpanElement>;

  @ViewChild('i18nValAbsDeaths', {static: true})
  i18nValAbsDeaths: ElementRef<HTMLSpanElement>;

  _dataAndOptions: PixelChartDataAndOptions;

  @Input()
  public set dataAndOptions(d: PixelChartDataAndOptions) {
    this._dataAndOptions = d;

    this.updateChart();
  }

  public get dataAndOptions(): PixelChartDataAndOptions {
    return this._dataAndOptions;
  }

  spec: any;

  constructor(
    private vegaPixelchartService: VegaPixelchartService,
  ) { }

  ngOnInit(): void {
    this.updateChart();
  }

  updateChart(): void {
    if (!this._dataAndOptions) {
      return;
    }

    this._dataAndOptions.chartOptions.yAxisTitle = this.i18nAltersgruppe.nativeElement.textContent;

    this._dataAndOptions.chartOptions.xAxisTitle = this._dataAndOptions.config.timeAgg === TimeGranularity.yearweek ? this.i18nWoche.nativeElement.textContent : this.i18nDatum.nativeElement.textContent;

    this._dataAndOptions.chartOptions.incidenceTitle = this._dataAndOptions.config.type === CovidNumberCaseType.cases
      ? this.i18nVal.nativeElement.textContent
      : this.i18nValDeaths.nativeElement.textContent;

      this._dataAndOptions.chartOptions.absValueTitle = this._dataAndOptions.config.type === CovidNumberCaseType.cases
      ? this.i18nValAbs.nativeElement.textContent
      : this.i18nValAbsDeaths.nativeElement.textContent;

    this.spec = this.vegaPixelchartService.compileChart(this._dataAndOptions.data, this._dataAndOptions.chartOptions);
  }
}
