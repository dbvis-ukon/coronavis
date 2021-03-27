import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { ScaleType, TimeGranularity } from 'src/app/cases-dod/covid-chart-options';
import { CovidNumberCaseNormalization, CovidNumberCaseTimeWindow, CovidNumberCaseType } from 'src/app/map/options/covid-number-case-options';
import { CaseDevelopmentRepository } from 'src/app/repositories/case-development.repository';
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

  titleRegions: string;

  eCovidNumberCaseType = CovidNumberCaseType;
  eCovidNumberCaseNormalization = CovidNumberCaseNormalization;
  eCovidNumberCaseTimeWindow = CovidNumberCaseTimeWindow;
  eCovidChartTimeGranularity = TimeGranularity;
  eCovidChartScaleType = ScaleType;

  constructor(
    private vegaPixelchartService: VegaPixelchartService,
    private caseRepo: CaseDevelopmentRepository
  ) { }

  ngOnInit(): void {
    this.updateChart();
  }

  updateChart(): void {
    if (!this._dataAndOptions) {
      return;
    }

    this.titleRegions = this._dataAndOptions.chartOptions.titleRegions.join(', ');

    this.spec = this.vegaPixelchartService.compileChart(this._dataAndOptions.data, this._dataAndOptions.chartOptions);
  }
}
